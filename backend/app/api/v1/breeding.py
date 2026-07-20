"""Palworld breeding calculation API endpoints.

Breeding system explained:
- Each pal has a "breeding_rank" (lower = rarer). Two parents produce the child
  whose breeding_rank is closest to their average.
- Special combos (e.g., Relaxaurus + Sparkit → Relaxaurus Lux) are stored
  directly in the breeding table and take precedence.
"""


from fastapi import APIRouter, HTTPException, Query

from app.core.database import query, query_one
from app.core.logging import logger

router = APIRouter(tags=["breeding"])

# ─── In-memory caches (loaded once, zero DB hits in hot path) ─────

_SPECIAL_COMBOS: set[tuple[str, str]] | None = None
_ALL_RANKS: dict[str, int] | None = None

_MAX_REVERSE_RESULTS = 50


def _load_caches():
    """Preload special combos and all ranks into memory."""
    global _SPECIAL_COMBOS, _ALL_RANKS
    if _SPECIAL_COMBOS is None:
        rows = query("SELECT LOWER(parent1) AS p1, LOWER(parent2) AS p2 FROM breeding WHERE is_special = TRUE")
        _SPECIAL_COMBOS = {(r["p1"], r["p2"]) for r in rows}
        logger.info("breeding_cache_loaded", special_combos=len(_SPECIAL_COMBOS))
    if _ALL_RANKS is None:
        rows = query("SELECT data->>'name' AS name, (data->>'breeding_rank')::int AS rank FROM pals WHERE data->>'breeding_rank' IS NOT NULL")
        _ALL_RANKS = {r["name"]: r["rank"] for r in rows}
        logger.info("breeding_ranks_loaded", count=len(_ALL_RANKS))


def _normalize(name: str) -> str:
    return name.strip().lower()


def _pal_exists(name: str) -> bool:
    return query_one("SELECT 1 FROM pals WHERE LOWER(data->>'name') = LOWER(%s)", (name,)) is not None


def _get_rank(name: str) -> int:
    """Get breeding rank from cache (fast, no DB)."""
    if _ALL_RANKS is None:
        _load_caches()
    return _ALL_RANKS.get(_normalize(name), 1500) if _ALL_RANKS else 1500


def _is_special(p1: str, p2: str) -> bool:
    """Check if a pair is a special combo (in-memory, no DB)."""
    if _SPECIAL_COMBOS is None:
        _load_caches()
    if _SPECIAL_COMBOS:
        return (p1, p2) in _SPECIAL_COMBOS or (p2, p1) in _SPECIAL_COMBOS
    return False


# ─── Endpoints ─────────────────────────────────────────────────────


@router.get("/calculate", summary="父代→子代")
async def calculate(
    parent1: str = Query(..., min_length=1, max_length=100, description="父代1"),
    parent2: str = Query(..., min_length=1, max_length=100, description="父代2"),
):
    """Calculate the child of two parent pals.

    Steps:
    1. Check special combos first (in-memory cache).
    2. Check direct combo matches (breeding table).
    3. Fallback to rank-based average calculation (in-memory).
    """
    p1, p2 = _normalize(parent1), _normalize(parent2)

    for name, label in [(p1, parent1), (p2, parent2)]:
        if not _pal_exists(name):
            raise HTTPException(
                status_code=404,
                detail={"code": "BREEDING.CALCULATE.INVALID_PARENT", "message": f"帕鲁 '{label}' 不存在"},
            )

    # Step 1: special combos (in-memory, 0 DB)
    if _is_special(p1, p2):
        child = query_one(
            "SELECT child FROM breeding WHERE is_special = TRUE AND ((LOWER(parent1) = %s AND LOWER(parent2) = %s) OR (LOWER(parent1) = %s AND LOWER(parent2) = %s))",
            (p1, p2, p2, p1),
        )
        if child:
            result = {"parent1": parent1, "parent2": parent2, "child": child["child"], "is_special": True}
            logger.info("breeding_special", parent1=parent1, parent2=parent2, child=result["child"])
            return {"data": result}

    # Step 2: direct combo match in breeding table
    direct = query_one(
        """SELECT child FROM breeding
           WHERE is_special = FALSE
           AND ((LOWER(parent1) = %s AND LOWER(parent2) = %s)
             OR (LOWER(parent1) = %s AND LOWER(parent2) = %s))""",
        (p1, p2, p2, p1),
    )
    if direct:
        result = {"parent1": parent1, "parent2": parent2, "child": direct["child"], "is_special": False}
        logger.info("breeding_direct", parent1=parent1, parent2=parent2, child=result["child"])
        return {"data": result}

    # Step 3: rank-based calculation (in-memory, 0 DB)
    _load_caches()
    assert _ALL_RANKS is not None
    r1, r2 = _ALL_RANKS.get(p1, 1500), _ALL_RANKS.get(p2, 1500)
    avg = (r1 + r2) // 2

    best_child = None
    best_diff = float("inf")
    for pal_name, rank in _ALL_RANKS.items():
        pn = _normalize(pal_name)
        if pn == p1 or pn == p2:
            continue
        diff = abs(rank - avg)
        if diff < best_diff:
            best_diff = diff
            best_child = pal_name

    if not best_child:
        raise HTTPException(
            status_code=404,
            detail={"code": "BREEDING.CALCULATE.NO_RESULT", "message": f"未找到 '{parent1}' + '{parent2}' 的繁殖结果"},
        )

    result = {
        "parent1": parent1,
        "parent2": parent2,
        "child": best_child,
        "is_special": False,
        "parent1_rank": r1,
        "parent2_rank": r2,
        "rank_average": avg,
    }
    logger.info("breeding_calculated", parent1=parent1, parent2=parent2, child=best_child, avg_rank=avg)
    return {"data": result}


@router.get("/reverse", summary="子代→父代")
async def reverse(
    target: str = Query(..., min_length=1, max_length=100, description="目标帕鲁"),
    max_results: int = Query(_MAX_REVERSE_RESULTS, ge=1, le=200, description="最大返回数"),
):
    """Find all parent combinations that produce the target pal.

    Uses in-memory cache — fast, no DB query per pair.
    Returns top N results for performance.
    """
    t = _normalize(target)
    if not _pal_exists(t):
        raise HTTPException(
            status_code=404,
            detail={"code": "BREEDING.REVERSE.INVALID_TARGET", "message": f"帕鲁 '{target}' 不存在"},
        )

    # Step 1: check breeding table (fast, indexed)
    results = query(
        """SELECT parent1, parent2, is_special FROM breeding
           WHERE LOWER(child) = %s
           ORDER BY parent1 LIMIT %s""",
        (t, max_results),
    )
    if results:
        logger.info("breeding_reverse_table", target=target, combinations=len(results))
        return {"data": results}

    # Step 2: rank-based calculation (in-memory, 0 DB)
    _load_caches()
    assert _ALL_RANKS is not None
    names = list(_ALL_RANKS.keys())
    generated = []
    iteration_count = 0
    MAX_ITERATIONS = 20000  # safety cap

    for i in range(len(names)):
        if len(generated) >= max_results:
            break
        p1_name = names[i]
        p1_norm = _normalize(p1_name)
        r1 = _ALL_RANKS.get(p1_name, 1500)

        for j in range(i + 1, len(names)):
            if len(generated) >= max_results:
                break
            iteration_count += 1
            if iteration_count > MAX_ITERATIONS:
                break

            p2_name = names[j]
            p2_norm = _normalize(p2_name)

            # Skip special combos
            if _is_special(p1_norm, p2_norm):
                continue

            r2 = _ALL_RANKS.get(p2_name, 1500)
            avg = (r1 + r2) // 2

            # Find child closest to avg — single memory lookup
            # Optimization: pre-calculate which rank maps to which child
            child = _find_child_by_rank(avg, p1_norm, p2_norm)
            if child and _normalize(child) == t:
                generated.append({
                    "parent1": p1_name,
                    "parent2": p2_name,
                    "is_special": False,
                    "parent1_rank": r1,
                    "parent2_rank": r2,
                    "rank_average": avg,
                })

        if iteration_count > MAX_ITERATIONS:
            break

    if not generated:
        raise HTTPException(
            status_code=404,
            detail={"code": "BREEDING.REVERSE.NO_COMBOS", "message": f"未找到 '{target}' 的父代组合"},
        )

    logger.info("breeding_reverse_ranked", target=target, combinations=len(generated), iterations=iteration_count)
    return {"data": generated[:max_results], "calculated": True, "total_found": len(generated)}


def _find_child_by_rank(avg: int, exclude_p1: str, exclude_p2: str) -> str | None:
    """Find pal whose rank is closest to avg, excluding parents. In-memory only."""
    global _ALL_RANKS
    if _ALL_RANKS is None:
        _load_caches()
        if _ALL_RANKS is None:
            return None

    best, best_diff = None, float("inf")
    for name, rank in _ALL_RANKS.items():
        n = _normalize(name)
        if n == exclude_p1 or n == exclude_p2:
            continue
        diff = abs(rank - avg)
        if diff < best_diff:
            best_diff = diff
            best = name
    return best
