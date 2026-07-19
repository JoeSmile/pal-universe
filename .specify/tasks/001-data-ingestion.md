# 001-data-ingestion

## Status
- status: completed
- assigned_to: hermes
- depends_on: []
- completed_at: 2026-07-19

## Goal

将 palworld-kb 数据复制到项目内，消除对外部仓库的依赖。建立数据目录结构。

## Files
- Create: `scripts/seed_palworld_data.py`
- Create: `scripts/validate_data.py`
- Create: `backend/data/VERSION`

## Acceptance Criteria
- [ ] `scripts/` 下有数据导入脚本
- [ ] 脚本可独立运行，不依赖外部仓库路径
- [ ] 运行 `python3 scripts/validate_data.py` 不报错
- [ ] 数据量级正确（299+ 帕鲁、所有繁殖组合、1195 物品）
- [ ] `backend/data/VERSION` 记录数据版本

## Implementation Hints
- 不直接复制原始 JSON，写一个 seed 脚本从 `~/Desktop/github/palworld-kb/data/` 读取
- 脚本要能独立运行，后续连接 pgvector 时再加数据库写入
- 先用内存加载验证数据结构完整，暂不入库
