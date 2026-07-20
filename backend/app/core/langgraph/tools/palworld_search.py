"""Palworld search, breeding, and location tools for LangGraph Agent.

Provides four @tool-decorated functions that load data from palworld-kb
JSON files at import time and expose them to the LangGraph agent without
any database dependency. Phase 2 may migrate to pgvector.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from langchain_core.tools import tool

# ── Data source resolution ─────────────────────────────────────────

_COMBI_RANKS: dict[str, int] = {}
_SPECIAL_COMBOS: list[dict[str, Any]] = []
_PALS: list[dict[str, Any]] = []
_LOCATIONS: dict[str, Any] = {}
_PAL_NAMES_INDEX: dict[str, str] = {}  # lowercase → original name


def _data_source() -> Path | None:
    """Resolve the palworld-kb data directory.

    Priority:
      1. PALWORLD_DATA environment variable
      2. Relative to project root (``./data/palworld-kb/data/``)
      3. Fallback to ``~/Desktop/github/palworld-kb/data/``
    """
    if env := os.environ.get("PALWORLD_DATA"):
        p = Path(env).resolve()
        if p.exists():
            return p

    # Walk up from this file's directory to find the project root
    # backend/app/core/langgraph/tools/palworld_search.py → backend/ → project
    here = Path(__file__).resolve().parent
    # Go up 4 levels: tools/ → langgraph/ → core/ → app/ → backend/
    backend_dir = here.parents[3]
    project_root = backend_dir.parent
    candidate = project_root / "data" / "palworld-kb" / "data"
    if candidate.exists():
        return candidate

    home_fallback = Path.home() / "Desktop" / "github" / "palworld-kb" / "data"
    if home_fallback.exists():
        return home_fallback

    return None


def _load_json(name: str, source: Path) -> Any:
    path = source / f"{name}.json"
    if not path.exists():
        return None
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _load_data() -> None:
    """Load/ reload all data from JSON files (idempotent after first call)."""
    global _PALS, _COMBI_RANKS, _SPECIAL_COMBOS, _LOCATIONS, _PAL_NAMES_INDEX

    if _PALS:
        return  # already loaded

    source = _data_source()
    if source is None:
        # Fall back to frontend data when palworld-kb source is unavailable
        here = Path(__file__).resolve().parent
        backend_dir = here.parents[3]
        project_root = backend_dir.parent
        frontend_data = project_root / "frontend" / "src" / "data"
        pals_path = frontend_data / "pals.json"
        if pals_path.exists():
            _PALS = json.loads(pals_path.read_text(encoding="utf-8"))
        breeding_path = frontend_data / "breeding.json"
        if breeding_path.exists():
            _SPECIAL_COMBOS = json.loads(breeding_path.read_text(encoding="utf-8"))
        loc_path = frontend_data / "pal-locations.json"
        if loc_path.exists():
            _LOCATIONS = json.loads(loc_path.read_text(encoding="utf-8"))
        # No combi_ranks in frontend data; skip rank-based breeding
        _build_index()
        return

    # Load from palworld-kb raw data
    pals_raw = _load_json("pals_combat", source)
    if pals_raw:
        _PALS = pals_raw

    breeding_raw = _load_json("breeding", source)
    if breeding_raw:
        _COMBI_RANKS = breeding_raw.get("combi_ranks", {})
        _SPECIAL_COMBOS = breeding_raw.get("special_combos", [])

    # Prefer the frontend data for locations (richer coordinate data),
    # fall back to palworld-kb's format which has regions/egg_types/alpha_locations
    here = Path(__file__).resolve().parent
    backend_dir = here.parents[3]
    project_root = backend_dir.parent
    frontend_loc = project_root / "frontend" / "src" / "data" / "pal-locations.json"
    if frontend_loc.exists():
        _LOCATIONS = json.loads(frontend_loc.read_text(encoding="utf-8"))
    else:
        loc_raw = _load_json("pal_locations", source)
        if loc_raw:
            _LOCATIONS = loc_raw.get("pals", {})

    _build_index()


def _build_index() -> None:
    global _PAL_NAMES_INDEX
    _PAL_NAMES_INDEX = {}
    for pal in _PALS:
        name = pal.get("name", "")
        if name:
            _PAL_NAMES_INDEX[name.lower()] = name


def _normalize(name: str) -> str:
    return name.strip().lower()


def _get_rank(name: str) -> int:
    """Return the combi rank for a pal; 1500 is the default."""
    return _COMBI_RANKS.get(name, _COMBI_RANKS.get(_normalize(name), 1500))


def _pal_exists(name: str) -> bool:
    return _normalize(name) in _PAL_NAMES_INDEX


def _find_child_by_rank(avg: int, exclude_p1: str, exclude_p2: str) -> str | None:
    """Find the pal whose combi rank is closest to *avg*."""
    if not _COMBI_RANKS:
        return None
    best, best_diff = None, float("inf")
    for name, rank in _COMBI_RANKS.items():
        n = _normalize(name)
        if n in (exclude_p1, exclude_p2):
            continue
        diff = abs(rank - avg)
        if diff < best_diff:
            best_diff = diff
            best = name
    return best


# Ensure data is loaded at import time so the first tool call is fast
_load_data()


# ── Tools ───────────────────────────────────────────────────────────


@tool
def pal_search(
    name: str = "",
    types: list[str] | None = None,
    work_type: str = "",
) -> str:
    """Search for Palworld pals by name, element type(s), or work suitability.

    Supports partial/fuzzy name matching (prefix match). When no filters are
    supplied, returns a summary of all 299 pals.

    Args:
        name: Pal name (case-insensitive prefix match).
        types: Element type filter, e.g. ``["Fire"]`` or ``["Fire", "Dark"]``.
               Valid types: Fire, Water, Grass, Electric, Ice, Ground, Dark,
               Dragon, Neutral.
        work_type: Work suitability filter, e.g. ``"mining"``, ``"kindling"``.

    Returns:
        JSON string of matching pal records (each containing name, elements,
        stats, work_orders, rarity, drops, etc.).
    """
    _load_data()
    results: list[dict[str, Any]] = []
    q = name.strip().lower()
    valid_types: set[str] = {
        "fire",
        "water",
        "grass",
        "electric",
        "ice",
        "ground",
        "dark",
        "dragon",
        "neutral",
    }
    selected_types: set[str] | None = None
    if types:
        selected_types = {t.strip().lower() for t in types if t.strip().lower() in valid_types}
    wt = work_type.strip().lower() if work_type else ""

    for pal in _PALS:
        pal_name = pal.get("name", "")

        # Name filter — prefix or substring match
        if q:
            if not pal_name.lower().startswith(q):
                continue

        # Element filter
        if selected_types:
            pal_elements = {e.lower() for e in pal.get("elements", [])}
            if not selected_types.intersection(pal_elements):
                continue

        # Work suitability filter
        if wt:
            work_orders = pal.get("work_orders") or pal.get("role_tags") or []
            matched = any(wt == wo.lower() if isinstance(wo, str) else False for wo in work_orders)
            if not matched:
                continue

        # Build a clean result
        result = {
            "name": pal_name,
            "elements": pal.get("elements", []),
            "rarity": pal.get("rarity", 1),
            "size": pal.get("size", ""),
            "deck_id": str(pal.get("paldeck_number", "")),
            "stats": pal.get("stats", {}),
            "nocturnal": pal.get("nocturnal", False),
            "drops": pal.get("notable_drops", []),
            "work_orders": pal.get("work_orders") or pal.get("role_tags", []),
            "image": f"/images/pals/{pal_name}.webp",
        }
        if _COMBI_RANKS:
            result["breeding_rank"] = _get_rank(pal_name)
        results.append(result)

    if not results:
        return json.dumps(
            {
                "error": "No pals found matching the given criteria.",
                "query": {"name": name, "types": types, "work_type": work_type},
            }
        )

    result_json = json.dumps({"count": len(results), "results": results}, ensure_ascii=False, indent=2)
    return result_json


@tool
def breeding_calc(parent1: str, parent2: str) -> str:
    """Calculate the offspring of two parent Palworld pals.

    First checks the hardcoded special-combo table; if the pair isn't
    special, falls back to the rank-based formula (average of the two
    parents' combi ranks, then find the pal whose rank is closest).

    Args:
        parent1: Name of the first parent pal.
        parent2: Name of the second parent pal.

    Returns:
        JSON string with the child (and formula details when rank-based).
    """
    _load_data()
    p1, p2 = _normalize(parent1), _normalize(parent2)

    if not _pal_exists(p1):
        return json.dumps({"error": f"Parent '{parent1}' not found."})
    if not _pal_exists(p2):
        return json.dumps({"error": f"Parent '{parent2}' not found."})

    # Step 1: check special combos (in-memory)
    for combo in _SPECIAL_COMBOS:
        ca = _normalize(combo.get("parent_a", combo.get("parent1", "")))
        cb = _normalize(combo.get("parent_b", combo.get("parent2", "")))
        child = combo.get("child", "")
        if (ca == p1 and cb == p2) or (ca == p2 and cb == p1):
            result = {
                "parent1": parent1,
                "parent2": parent2,
                "child": child,
                "is_special": True,
            }
            return json.dumps(result, ensure_ascii=False)

    # Step 2: rank-based formula
    if not _COMBI_RANKS:
        return json.dumps(
            {
                "error": "Breeding ranks not available (palworld-kb data source not found). "
                "Only special combos can be queried.",
                "special_combos_available": True,
            }
        )

    r1, r2 = _get_rank(parent1), _get_rank(parent2)
    avg = (r1 + r2) // 2
    child = _find_child_by_rank(avg, p1, p2)

    if not child:
        return json.dumps({"error": f"No compatible breeding result for '{parent1}' + '{parent2}'."})

    result = {
        "parent1": parent1,
        "parent2": parent2,
        "child": child,
        "is_special": False,
        "parent1_rank": r1,
        "parent2_rank": r2,
        "rank_average": avg,
    }
    return json.dumps(result, ensure_ascii=False)


@tool
def breeding_reverse(target: str, max_results: int = 30) -> str:
    """Find all parent combinations that produce a target Palworld pal.

    Searches the special-combo table first, then scans all pal pairs via
    the rank-based formula for up to *max_results* combinations.

    Args:
        target: Name of the desired child pal.
        max_results: Maximum parent combinations to return (default 30).

    Returns:
        JSON string of parent pairs that produce the target.
    """
    _load_data()
    t = _normalize(target)

    if not _pal_exists(t):
        return json.dumps({"error": f"Target pal '{target}' not found."})

    parents: list[dict] = []

    # Step 1: special combos where this pal is the child
    for combo in _SPECIAL_COMBOS:
        if _normalize(combo.get("child", "")) == t:
            parents.append(
                {
                    "parent1": combo.get("parent_a", combo.get("parent1", "")),
                    "parent2": combo.get("parent_b", combo.get("parent2", "")),
                    "is_special": True,
                }
            )

    # Step 2: rank-based formula — scan all pal pairs
    if _COMBI_RANKS:
        names = list(_COMBI_RANKS.keys())
        count = 0
        for i in range(len(names)):
            if len(parents) >= max_results:
                break
            p1_name = names[i]
            r1 = _COMBI_RANKS.get(p1_name, 1500)
            for j in range(i + 1, len(names)):
                if len(parents) >= max_results:
                    break
                p2_name = names[j]
                p2_norm = _normalize(p2_name)
                # Skip pairs that are already in special combos
                is_special = any(
                    (
                        _normalize(c.get("parent_a", c.get("parent1", ""))) == _normalize(p1_name)
                        and _normalize(c.get("parent_b", c.get("parent2", ""))) == p2_norm
                    )
                    or (
                        _normalize(c.get("parent_a", c.get("parent1", ""))) == p2_norm
                        and _normalize(c.get("parent_b", c.get("parent2", ""))) == _normalize(p1_name)
                    )
                    for c in _SPECIAL_COMBOS
                )
                if is_special:
                    continue

                r2 = _COMBI_RANKS.get(p2_name, 1500)
                avg = (r1 + r2) // 2
                child = _find_child_by_rank(avg, _normalize(p1_name), p2_norm)
                if child and _normalize(child) == t:
                    parents.append(
                        {
                            "parent1": p1_name,
                            "parent2": p2_name,
                            "is_special": False,
                            "parent1_rank": r1,
                            "parent2_rank": r2,
                            "rank_average": avg,
                        }
                    )
                count += 1
                if count > 30000:
                    break  # safety cap

    if not parents:
        return json.dumps({"error": f"No parent combinations found for '{target}'."})

    return json.dumps(
        {"target": target, "total": len(parents), "combinations": parents[:max_results]},
        ensure_ascii=False,
        indent=2,
    )


@tool
def map_search(pal_name: str) -> str:
    """Find the in-game location for a Palworld pal.

    Args:
        pal_name: Exact name of the pal to locate.

    Returns:
        JSON string with spawn count, region, center coordinates, level range,
        and detailed spawn spots.
    """
    _load_data()
    normalized = _normalize(pal_name)

    if not _pal_exists(normalized):
        return json.dumps({"error": f"Pal '{pal_name}' not found."})

    # Try exact match first, then case-insensitive
    loc = _LOCATIONS.get(pal_name)
    if loc is None:
        for key, val in _LOCATIONS.items():
            if _normalize(key) == normalized:
                loc = val
                break

    if loc is None:
        return json.dumps({"error": f"No location data for '{pal_name}'."})

    result = {
        "name": pal_name,
        "spawn_count": loc.get("spawn_count", 0),
        "region": loc.get("region", "unknown"),
        "center": loc.get("center", []),
        "level_range": loc.get("level_range", []),
        "spots": loc.get("spots", [])[:5],  # limit to 5 spots for LLM brevity
    }
    return json.dumps(result, ensure_ascii=False, indent=2)


# ── CLI entry point (manual test) ──────────────────────────────────

if __name__ == "__main__":
    import json

    def _test():
        print("=== pal_search (name prefix) ===")
        print(pal_search.invoke({"name": "Anubis"}))

        print("\n=== pal_search (by type Fire) ===")
        result = json.loads(pal_search.invoke({"types": ["Fire"]}))
        print(f"Found {result['count']} Fire-type pals")

        print("\n=== breeding_calc (special combo) ===")
        print(breeding_calc.invoke({"parent1": "Relaxaurus", "parent2": "Sparkit"}))

        print("\n=== breeding_calc (rank-based) ===")
        print(breeding_calc.invoke({"parent1": "Anubis", "parent2": "Cattiva"}))

        print("\n=== breeding_reverse ===")
        print(breeding_reverse.invoke({"target": "Anubis", "max_results": 5}))

        print("\n=== map_search ===")
        print(map_search.invoke({"pal_name": "Melpaca"}))

    _test()
