#!/usr/bin/env python3
"""
数据完整性验证 — CI 中调用，确保数据没有被破坏。
"""

import sys
from seed_palworld_data import load_all, validate

def main():
    print("🔍 Pal Universe 数据验证")
    print("=" * 40)
    data = load_all()
    errors = validate(data)

    summary = data.summary()
    print()
    print(f"   帕鲁: {summary['pals']}")
    print(f"   繁殖排名: {summary['breeding_ranks']}")
    print(f"   特殊组合: {summary['special_combos']}")
    print(f"   物品: {summary['items']}")
    print(f"   主动技能: {summary['active_skills']}")
    print(f"   被动技能: {summary['passives']}")
    print(f"   位置: {summary['pal_locations']}")
    print()

    if errors:
        print(f"❌ 验证失败: {len(errors)} 个问题")
        for e in errors:
            print(f"   - {e}")
        sys.exit(1)
    else:
        print("✅ 验证通过")
        sys.exit(0)

if __name__ == "__main__":
    main()
