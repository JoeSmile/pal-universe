#!/usr/bin/env python3
"""
处理 palworld-atlas-data，提取帕鲁位置坐标。
输出: frontend/src/data/pal-locations.json
"""

import json
import os
from pathlib import Path
from collections import defaultdict

ATLAS_DIR = Path(os.environ.get("ATLAS_DATA", Path.home() / "Desktop" / "github" / "palworld-atlas-data"))
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "frontend" / "src" / "data"


def main():
    # 查找最新的 builds 版本
    builds_dir = ATLAS_DIR / "published" / "v1" / "builds"
    versions = sorted(builds_dir.iterdir())
    if not versions:
        print("❌ 未找到 builds 目录")
        return
    latest_build = versions[-1]
    print(f"📂 使用 build: {latest_build.name}")

    # 读取 spawns
    spawns_path = latest_build / "maps" / "palpagos" / "spawns.json"
    if not spawns_path.exists():
        print(f"❌ 未找到 spawns.json: {spawns_path}")
        return

    spawns = json.loads(spawns_path.read_text())
    spawn_list = spawns["spawns"]
    print(f"📊 总刷新点: {len(spawn_list)}")

    # 按帕鲁聚合
    by_pal = defaultdict(list)
    for s in spawn_list:
        by_pal[s["palName"]].append({
            "x": round(s["imageX"], 1),
            "y": round(s["imageY"], 1),
            "map_x": round(s.get("mapX", 0), 1),
            "map_y": round(s.get("mapY", 0), 1),
            "region": s.get("region", "palpagos"),
            "level_range": [s.get("minLevel", 1), s.get("maxLevel", 50)],
        })

    # 压缩: 合并相同坐标的点，去重
    result = {}
    for pal_name, points in by_pal.items():
        seen = set()
        unique = []
        for p in points:
            key = (p["x"], p["y"])
            if key not in seen:
                seen.add(key)
                unique.append(p)

        # 计算中心坐标
        xs = [p["x"] for p in unique]
        ys = [p["y"] for p in unique]
        min_level = min(p["level_range"][0] for p in unique)
        max_level = max(p["level_range"][1] for p in unique)

        result[pal_name] = {
            "spawn_count": len(unique),
            "region": unique[0]["region"],
            "center": [round(sum(xs) / len(xs), 1), round(sum(ys) / len(ys), 1)],
            "bounds": [[min(xs), min(ys)], [max(xs), max(ys)]],
            "level_range": [min_level, max_level],
            "spots": unique[:50],  # 最多保留 50 个点
        }

    # 写入
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = OUTPUT_DIR / "pal-locations.json"
    output_path.write_text(json.dumps(result, ensure_ascii=False, indent=1))
    print(f"✅ 已写入 {output_path}")
    print(f"📊 {len(result)} 种帕鲁有位置数据")


if __name__ == "__main__":
    main()
