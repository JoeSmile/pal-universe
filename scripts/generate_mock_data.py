#!/usr/bin/env python3
"""
生成前端 Mock 数据 — 从 pgvector 导出 JSON 供前端独立开发使用。
前端在 Phase 1 直接读这些 JSON，不依赖后端 API。
"""

import json
import os
from pathlib import Path

DB_CONFIG = {
    "host": os.environ.get("POSTGRES_HOST", "localhost"),
    "port": int(os.environ.get("POSTGRES_PORT", "5432")),
    "user": os.environ.get("POSTGRES_USER", "paluniverse"),
    "password": os.environ.get("POSTGRES_PASSWORD", "paluniverse_dev"),
    "dbname": os.environ.get("POSTGRES_DB", "paluniverse"),
}

OUTPUT = Path(__file__).resolve().parent.parent / "frontend" / "src" / "data"


def main():
    import psycopg2

    OUTPUT.mkdir(parents=True, exist_ok=True)
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    # 帕鲁列表（精简版 — 搜索/卡片用）
    cur.execute("""
        SELECT name, elements, deck_id, rarity, size,
               hp, melee_attack, shot_attack, defense, support, stamina, price,
               drops, work_orders, data
        FROM pals ORDER BY deck_id
    """)
    pals = []
    for row in cur.fetchall():
        pals.append({
            "name": row[0],
            "elements": row[1],
            "deck_id": row[2],
            "rarity": row[3],
            "size": row[4],
            "stats": {
                "hp": row[5], "melee_attack": row[6], "shot_attack": row[7],
                "defense": row[8], "support": row[9], "stamina": row[10],
            },
            "price": row[11],
            "drops": row[12] if row[12] else [],
            "work_orders": row[13] if row[13] else [],
        })
    with open(OUTPUT / "pals.json", "w") as f:
        json.dump(pals, f, ensure_ascii=False, indent=2)
    print(f"✅ pals.json: {len(pals)} 帕鲁")

    # 繁殖组合（精简版 — 仅特殊组合）
    cur.execute("SELECT parent1, parent2, child, is_special FROM breeding ORDER BY parent1")
    combos = [{"parent1": r[0], "parent2": r[1], "child": r[2], "is_special": r[3]} for r in cur.fetchall()]
    with open(OUTPUT / "breeding.json", "w") as f:
        json.dump(combos, f, ensure_ascii=False, indent=2)
    print(f"✅ breeding.json: {len(combos)} 组合")

    # 繁殖排名
    cur.execute("SELECT name, data->'breeding_rank' FROM pals WHERE data->>'breeding_rank' IS NOT NULL")
    ranks = {r[0]: r[1] for r in cur.fetchall() if r[1]}
    with open(OUTPUT / "breeding-ranks.json", "w") as f:
        json.dump(ranks, f, ensure_ascii=False, indent=2)
    print(f"✅ breeding-ranks.json: {len(ranks)} 项")

    # 元素克制
    cur.execute("SELECT data FROM items LIMIT 0")  # placeholder
    type_chart = {
        "fire": {"strong_against": ["grass", "ice"], "weak_against": ["water", "ground"]},
        "water": {"strong_against": ["fire", "ground"], "weak_against": ["electric", "grass"]},
        "grass": {"strong_against": ["water", "ground"], "weak_against": ["fire", "ice"]},
        "electric": {"strong_against": ["water"], "weak_against": ["ground"]},
        "ice": {"strong_against": ["grass", "dragon"], "weak_against": ["fire"]},
        "ground": {"strong_against": ["fire", "electric"], "weak_against": ["water", "grass"]},
        "dark": {"strong_against": ["neutral"], "weak_against": ["dragon"]},
        "dragon": {"strong_against": ["dark"], "weak_against": ["ice", "dragon"]},
        "neutral": {"strong_against": [], "weak_against": ["dark"]},
    }
    with open(OUTPUT / "type-chart.json", "w") as f:
        json.dump(type_chart, f, ensure_ascii=False, indent=2)
    print(f"✅ type-chart.json: 9 元素")

    cur.close()
    conn.close()
    print(f"\n📁 数据目录: {OUTPUT}")
    print("💡 前端开发直接 import 这些 JSON，不依赖后端 API")


if __name__ == "__main__":
    main()
