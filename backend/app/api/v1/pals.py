"""Palworld pal search and detail API endpoints."""

import json
import os
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException, Query

from app.core.database import query, query_one
from app.core.logging import logger

router = APIRouter(tags=["pals"])

# Load location data (lazy)
_LOCATIONS: dict[str, Any] | None = None
_WORK_ORDERS: dict[str, list[dict[str, Any]]] | None = None


def _frontend_data_candidates(filename: str) -> list[Path | None]:
    here = Path(__file__).resolve()
    return [
        here.parents[3].parent / "frontend" / "src" / "data" / filename,
        here.parents[3] / "frontend" / "src" / "data" / filename,
        Path(os.environ[f"PAL_{filename.upper().replace('.', '_').replace('-', '_')}"])
        if os.environ.get(f"PAL_{filename.upper().replace('.', '_').replace('-', '_')}")
        else None,
    ]


def _get_locations() -> dict[str, Any]:
    global _LOCATIONS
    if _LOCATIONS is None:
        candidates = [
            *_frontend_data_candidates("pal-locations.json")[:2],
            Path(os.environ["PAL_LOCATIONS_PATH"]) if os.environ.get("PAL_LOCATIONS_PATH") else None,
        ]
        path = next((p for p in candidates if p is not None and p.exists()), None)
        if path is not None:
            data = json.loads(path.read_text())
            _LOCATIONS = data if isinstance(data, dict) else {}
            logger.info("locations_loaded", count=len(_LOCATIONS), path=str(path))
        else:
            _LOCATIONS = {}
            logger.warning(
                "locations_file_not_found",
                tried=[str(p) for p in candidates if p is not None],
            )
    return _LOCATIONS


def _get_work_orders_map() -> dict[str, list[dict[str, Any]]]:
    """Leveled work suitability overlay (Handiwork 6, Mining 6, …)."""
    global _WORK_ORDERS
    if _WORK_ORDERS is None:
        candidates = _frontend_data_candidates("pal-work-orders.json")
        path = next((p for p in candidates if p is not None and p.exists()), None)
        if path is not None:
            data = json.loads(path.read_text())
            _WORK_ORDERS = data if isinstance(data, dict) else {}
            logger.info("work_orders_loaded", count=len(_WORK_ORDERS), path=str(path))
        else:
            _WORK_ORDERS = {}
            logger.warning(
                "work_orders_file_not_found",
                tried=[str(p) for p in candidates if p is not None],
            )
    return _WORK_ORDERS


def _leveled_works_for(name: str) -> list[dict[str, Any]] | None:
    raw = _get_work_orders_map().get(name)
    if not isinstance(raw, list) or not raw:
        return None
    works: list[dict[str, Any]] = []
    for entry in raw:
        if not isinstance(entry, dict) or not entry.get("skill"):
            continue
        level = int(entry.get("level") or 1)
        works.append({"skill": str(entry["skill"]), "level": max(1, min(10, level))})
    return works or None


def _normalize_work_orders(data: dict[str, Any], name: str = "") -> list[dict[str, Any]]:
    leveled = _leveled_works_for(name or str(data.get("name") or ""))
    if leveled:
        return leveled

    works: list[dict[str, Any]] = []
    raw_orders = data.get("work_orders")
    if isinstance(raw_orders, list) and raw_orders:
        for entry in raw_orders:
            if isinstance(entry, str) and entry:
                works.append({"skill": entry, "level": 1})
            elif isinstance(entry, dict) and entry.get("skill"):
                works.append(
                    {
                        "skill": str(entry["skill"]),
                        "level": max(1, min(10, int(entry.get("level") or 1))),
                    }
                )
        # Prefer real work skills over role-only tags when levels are all 1
        if any(isinstance(e, dict) and int(e.get("level") or 1) > 1 for e in works):
            return works
        return [w for w in works if w["skill"] != "fighter"] or works

    role_tags = data.get("role_tags")
    if isinstance(role_tags, list):
        for tag in role_tags:
            if isinstance(tag, str) and tag and tag != "fighter":
                works.append({"skill": tag, "level": 1})
    return works


VALID_ELEMENT_TYPES: set[str] = {
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

RARITY_RANK: dict[str, int] = {
    "common": 1,
    "rare": 2,
    "epic": 3,
    "legendary": 4,
}

# Supports:
# - role_tags: ["mining", ...]  (current seed schema)
# - work_orders: ["mining"] or [{"skill":"mining","level":1}]
_WORK_MATCH_SQL = """
(
  EXISTS (
    SELECT 1
    FROM jsonb_array_elements_text(COALESCE(data->'role_tags', '[]'::jsonb)) AS tag
    WHERE LOWER(tag) = ANY(%s)
  )
  OR EXISTS (
    SELECT 1
    FROM jsonb_array_elements(COALESCE(data->'work_orders', '[]'::jsonb)) AS wo
    WHERE LOWER(
      CASE jsonb_typeof(wo)
        WHEN 'string' THEN wo #>> '{}'
        WHEN 'object' THEN COALESCE(wo->>'skill', '')
        ELSE ''
      END
    ) = ANY(%s)
  )
)
"""


def _normalize_elements(types: str | None) -> list[str]:
    if not types:
        return []
    selected = [t.strip().lower() for t in types.split(",") if t.strip()]
    invalid = [t for t in selected if t not in VALID_ELEMENT_TYPES]
    if invalid:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "PAL.SEARCH.INVALID_TYPES",
                "message": f"无效元素类型: {', '.join(invalid)}",
            },
        )
    return [t.capitalize() for t in selected]


def _normalize_works(work: str | None) -> list[str]:
    if not work:
        return []
    return [w.strip().lower() for w in work.split(",") if w.strip()]


def _search_params(
    q: str,
    types: str | None,
    work: str | None,
    page: int,
    per_page: int,
) -> tuple[str, list[Any], int]:
    """Build WHERE clause and params. Returns (where_sql, params, offset)."""
    conditions: list[str] = []
    params: list[Any] = []

    if q:
        conditions.append("(data->>'name' ILIKE %s OR COALESCE(data->>'name_cn', '') ILIKE %s)")
        like_q = f"%{q}%"
        params.extend([like_q, like_q])

    selected_elements = _normalize_elements(types)
    if selected_elements:
        conditions.append("data->'elements' ?| %s")
        params.append(selected_elements)

    selected_works = _normalize_works(work)
    if selected_works:
        conditions.append(_WORK_MATCH_SQL)
        params.extend([selected_works, selected_works])

    where = " AND ".join(conditions) if conditions else "TRUE"
    offset = (page - 1) * per_page
    return where, params, offset


def _parse_rarity(raw: Any) -> int:
    if raw is None:
        return 1
    if isinstance(raw, (int, float)):
        return max(1, min(5, int(raw)))
    text = str(raw).strip()
    if text.isdigit():
        return max(1, min(5, int(text)))
    return RARITY_RANK.get(text.lower(), 1)


def _row_to_pal(row: dict[str, Any]) -> dict[str, Any]:
    """Normalize a DB row into the list/card payload."""
    # Prefer nested data blob; fall back to flattened SELECT aliases.
    raw_data = row.get("data")
    data: dict[str, Any] = raw_data if isinstance(raw_data, dict) else row

    name = data.get("name") or row.get("name") or ""
    elements = data.get("elements") or row.get("elements") or []
    if isinstance(elements, str):
        elements = [elements]

    stats_raw = data.get("stats")
    stats_obj: dict[str, Any] = stats_raw if isinstance(stats_raw, dict) else {}
    stats = {
        "hp": int(stats_obj.get("hp") or data.get("hp") or 0),
        "melee_attack": int(
            stats_obj.get("melee_attack") or data.get("melee_attack") or data.get("attack") or 0
        ),
        "shot_attack": int(
            stats_obj.get("shot_attack") or data.get("shot_attack") or data.get("attack") or 0
        ),
        "defense": int(stats_obj.get("defense") or data.get("defense") or 0),
        "support": int(stats_obj.get("support") or data.get("support") or 0),
        "stamina": int(stats_obj.get("stamina") or data.get("stamina") or 0),
    }

    deck_id = row.get("deck_id") or row.get("id") or data.get("paldeck_number") or ""
    return {
        "id": deck_id,
        "deck_id": str(deck_id),
        "name": name,
        "name_cn": data.get("name_cn") or row.get("name_cn") or name,
        "elements": elements,
        "rarity": _parse_rarity(data.get("rarity") or row.get("rarity")),
        "size": data.get("size") or row.get("size") or "",
        "stats": stats,
        "work_orders": _normalize_work_orders(data, name),
        "image": f"/images/pals/{name}.webp" if name else None,
    }


@router.get("/search", summary="搜索帕鲁")
async def search_pals(
    q: str = Query("", min_length=0, max_length=50, description="搜索关键词"),
    types: str | None = Query(None, description="元素过滤，逗号分隔，如 fire,dragon"),
    work: str | None = Query(None, description="工作适性过滤，逗号分隔，如 mining,kindling"),
    page: int = Query(1, ge=1, le=100, description="页码"),
    per_page: int = Query(24, ge=1, le=50, description="每页条数"),
):
    """Search pals by name (EN/CN), element type, and work suitability.

    Empty filters returns the full catalog (paginated) for list browsing.
    """
    where, params, _ = _search_params(q, types, work, page, per_page)

    total = query_one(f"SELECT COUNT(*) AS total FROM pals WHERE {where}", params)
    total_count = int(total["total"]) if total else 0
    total_pages = max(1, (total_count + per_page - 1) // per_page) if total_count else 0
    safe_page = min(max(1, page), total_pages) if total_pages else 1
    offset = (safe_page - 1) * per_page

    if total_count == 0:
        return {
            "data": [],
            "page": 1,
            "per_page": per_page,
            "total": 0,
            "total_pages": 0,
            "has_next": False,
            "has_prev": False,
        }

    data_sql = f"""
        SELECT
            deck_id AS id,
            deck_id,
            data
        FROM pals
        WHERE {where}
        ORDER BY
            NULLIF(regexp_replace(COALESCE(data->>'paldeck_number', deck_id::text), '[^0-9]', '', 'g'), '')::int ASC NULLS LAST,
            COALESCE(data->>'paldeck_number', deck_id::text) ASC,
            data->>'name' ASC
        LIMIT %s OFFSET %s
    """
    rows = query(data_sql, params + [per_page, offset])
    payload = [_row_to_pal(dict(row)) for row in rows]

    logger.info("pals_search_results", query=q, count=total_count, page=safe_page)
    return {
        "data": payload,
        "page": safe_page,
        "per_page": per_page,
        "total": total_count,
        "total_pages": total_pages,
        "has_next": safe_page < total_pages,
        "has_prev": safe_page > 1,
    }


@router.get("/{name}", summary="帕鲁详情")
async def get_pal(name: str):
    """Get full details for a specific pal by name."""
    row = query_one(
        "SELECT * FROM pals WHERE LOWER(data->>'name') = LOWER(%s)",
        (name,),
    )
    if not row:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "PAL.DETAIL.NOT_FOUND",
                "message": f"帕鲁 '{name}' 不存在",
            },
        )

    result = row["data"] if isinstance(row.get("data"), dict) else {}
    result["image"] = f"/images/pals/{row.get('name', name)}.webp"
    result["work_orders"] = _normalize_work_orders(result, row.get("name") or name)

    locations = _get_locations()
    loc = locations.get(row.get("name", name))
    if loc:
        result["location"] = {
            key: loc[key] for key in ("spawn_count", "region", "center", "level_range") if key in loc
        }

    logger.info("pal_detail_fetched", name=name)
    return {"data": result}


@router.get("/{name}/locations", summary="帕鲁位置")
async def get_pal_locations(name: str):
    """Get spawn locations for a specific pal."""
    if not query_one("SELECT 1 FROM pals WHERE LOWER(data->>'name') = LOWER(%s)", (name,)):
        raise HTTPException(
            status_code=404,
            detail={
                "code": "PAL.DETAIL.NOT_FOUND",
                "message": f"帕鲁 '{name}' 不存在",
            },
        )

    locations = _get_locations()
    loc = locations.get(name, {})

    if not loc:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "PAL.LOCATION.NOT_FOUND",
                "message": f"未找到 '{name}' 的位置数据",
            },
        )

    logger.info("pal_locations_fetched", name=name, spawn_count=loc.get("spawn_count", 0))
    return {"data": loc}
