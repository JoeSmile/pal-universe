#!/usr/bin/env python3
"""
Pal Universe — 数据加载与验证工具

从 palworld-kb 加载所有 JSON 数据结构，验证完整性。
后续扩展：写入 pgvector。
"""

import json
import os
import sys
from pathlib import Path
from dataclasses import dataclass, field
from typing import Any


def _default_data_source() -> Path:
    """从项目根目录计算默认数据源路径"""
    script_dir = Path(__file__).resolve().parent
    project_root = script_dir.parent
    candidate = project_root / "data" / "palworld-kb" / "data"
    if candidate.exists():
        return candidate
    # 兼容本地开发路径
    home_fallback = Path.home() / "Desktop" / "github" / "palworld-kb" / "data"
    if home_fallback.exists():
        return home_fallback
    return candidate


DATA_SOURCE = _default_data_source()
if (p := os.environ.get("PALWORLD_DATA")):
    DATA_SOURCE = Path(p).resolve()

VERSION_FILE = Path(__file__).resolve().parent.parent / "backend" / "data" / "VERSION"

EXPECTED_PAL_COUNT = 299


@dataclass
class PalworldData:
    """加载后的完整数据集"""
    pals: list[dict] = field(default_factory=list)
    breeding_ranks: dict[str, int] = field(default_factory=dict)
    special_combos: list[dict] = field(default_factory=list)
    items: list[dict] = field(default_factory=list)
    active_skills: dict[str, Any] = field(default_factory=dict)
    passives: list[dict] = field(default_factory=list)
    type_chart: dict[str, Any] = field(default_factory=dict)
    pal_locations: dict[str, Any] = field(default_factory=dict)
    regions: list[dict] = field(default_factory=list)
    tier_lists: list[dict] = field(default_factory=list)
    expeditions: dict[str, Any] = field(default_factory=dict)
    resource_nodes: list[dict] = field(default_factory=list)
    bosses: list[dict] = field(default_factory=list)
    merchants: list[dict] = field(default_factory=list)
    skill_dps: list[dict] = field(default_factory=list)

    meta: dict[str, str] = field(default_factory=dict)

    def summary(self) -> dict:
        return {
            "pals": len(self.pals),
            "breeding_ranks": len(self.breeding_ranks),
            "special_combos": len(self.special_combos),
            "items": len(self.items),
            "active_skills": len(self.active_skills.get("skills", [])),
            "passives": len(self.passives),
            "pal_locations": len(self.pal_locations.get("pals", {})),
            "regions": len(self.regions),
            "tier_lists": len(self.tier_lists),
        }


def load_json(name: str) -> Any:
    """加载 JSON 文件，文件缺失时给出清晰提示"""
    path = DATA_SOURCE / f"{name}.json"
    if not path.exists():
        print(f"  ❌ 文件不存在: {path}")
        print(f"  💡 设置 PALWORLD_DATA 环境变量指向数据目录，或确保项目 data/ 目录下有数据")
        sys.exit(1)
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        print(f"  ❌ JSON 解析失败: {path}")
        print(f"  💡 {e}")
        sys.exit(1)


def load_all() -> PalworldData:
    d = PalworldData()

    # 帕鲁战斗数据
    d.pals = load_json("pals_combat")

    # 繁殖
    breeding = load_json("breeding")
    d.breeding_ranks = breeding.get("combi_ranks", {})
    d.special_combos = breeding.get("special_combos", [])
    d.meta["breeding_version"] = breeding.get("game_version", "unknown")
    d.meta["breeding_updated"] = breeding.get("updated", "unknown")

    # 物品
    items_data = load_json("items")
    d.items = items_data.get("items", [])
    d.meta["items_version"] = items_data.get("game_version", "unknown")

    # 技能
    d.active_skills = load_json("active_skills")
    d.meta["skills_version"] = d.active_skills.get("game_version", "unknown")

    # 被动
    passives_data = load_json("passives")
    d.passives = passives_data.get("passives", [])
    d.meta["passives_version"] = passives_data.get("game_version", "unknown")

    # 属性克制
    d.type_chart = load_json("type_chart")
    d.meta["type_chart_version"] = d.type_chart.get("game_version", "unknown")

    # 位置
    d.pal_locations = load_json("pal_locations")
    d.meta["locations_version"] = d.pal_locations.get("game_version", "unknown")

    # 区域
    d.regions = load_json("regions")

    # Tier
    d.tier_lists = load_json("tier_lists")

    # 远征
    d.expeditions = load_json("expeditions")
    d.meta["expeditions_version"] = d.expeditions.get("game_version", "unknown")

    # 资源点
    d.resource_nodes = load_json("resource_nodes")

    # Boss
    d.bosses = load_json("bosses")

    # 商人
    d.merchants = load_json("merchants")

    # 技能 DPS
    d.skill_dps = load_json("skill_dps_meta")

    return d


def validate(d: PalworldData) -> list[str]:
    errors = []

    # 1. 帕鲁数量
    if len(d.pals) < EXPECTED_PAL_COUNT:
        errors.append(f"帕鲁数量不足: 期望 >= {EXPECTED_PAL_COUNT}, 实际 {len(d.pals)}")
    else:
        print(f"  ✅ 帕鲁: {len(d.pals)} 只")

    # 2. 帕鲁必填字段
    required_pal_keys = {"name", "elements", "rarity", "hp", "defense"}
    for pal in d.pals:
        missing = required_pal_keys - set(pal.keys())
        if missing:
            errors.append(f"帕鲁 '{pal.get('name', '?')}' 缺少字段: {missing}")
            break  # 一个报错就够了

    # 3. 繁殖
    if len(d.breeding_ranks) < 200:
        errors.append(f"繁殖 ranking 不足: {len(d.breeding_ranks)}")
    else:
        print(f"  ✅ 繁殖排名: {len(d.breeding_ranks)} 项")

    print(f"  ✅ 特殊组合: {len(d.special_combos)} 组")

    # 4. 物品
    if len(d.items) < 500:
        errors.append(f"物品数量不足: {len(d.items)}")
    else:
        print(f"  ✅ 物品: {len(d.items)} 个")

    # 5. 技能
    skill_count = len(d.active_skills.get("skills", []))
    if skill_count < 200:
        errors.append(f"主动技能数量不足: {skill_count}")
    else:
        print(f"  ✅ 主动技能: {skill_count} 个")

    # 6. 被动
    if len(d.passives) < 50:
        errors.append(f"被动技能数量不足: {len(d.passives)}")
    else:
        print(f"  ✅ 被动技能: {len(d.passives)} 个")

    # 7. 属性克制
    if "chart" not in d.type_chart:
        errors.append("属性克制表缺少 chart 字段")
    else:
        print(f"  ✅ 属性克制: {len(d.type_chart['chart'])} 组")

    # 8. 位置
    location_count = len(d.pal_locations.get("pals", {}))
    if location_count < 200:
        errors.append(f"帕鲁位置数量不足: {location_count}")
    else:
        print(f"  ✅ 帕鲁位置: {location_count} 只")

    return errors


def write_version_file(d: PalworldData) -> str:
    """写入版本标记文件"""
    summary = d.summary()
    summary["meta"] = d.meta
    VERSION_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(VERSION_FILE, "w") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    return str(VERSION_FILE)


def main():
    print(f"📂 数据源: {DATA_SOURCE}")
    print()

    print("🔄 加载数据...")
    data = load_all()
    summary = data.summary()
    for k, v in summary.items():
        print(f"   {k}: {v}")
    print()

    print("🔍 验证数据完整性...")
    errors = validate(data)
    print()

    if errors:
        print(f"❌ 发现 {len(errors)} 个问题:")
        for e in errors:
            print(f"   - {e}")
        sys.exit(1)
    else:
        print("✅ 所有数据验证通过！")

    version_path = write_version_file(data)
    print(f"📝 版本文件: {version_path}")


if __name__ == "__main__":
    main()
