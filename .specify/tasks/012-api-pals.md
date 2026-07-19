# 012-api-pals

## Status
- status: pending
- assigned_to: hermes
- depends_on: []

## Goal

实现帕鲁查询 API（搜索 + 详情），从 pgvector 读取数据。

## Files
- Create: `backend/app/api/v1/pals.py`
- Modify: `backend/app/api/v1/api.py`（注册路由）

## Acceptance Criteria
- [ ] `GET /api/v1/pals/search?q=Anubis` 返回正确结果
- [ ] `GET /api/v1/pals/search?types=fire,dragon` 过滤正确
- [ ] `GET /api/v1/pals/Anubis` 返回完整详情
- [ ] 搜索无结果返回 `PAL.SEARCH.NO_RESULTS`
- [ ] 帕鲁不存在返回 `PAL.DETAIL.NOT_FOUND`
- [ ] TypeScript ❌（后端 Python）→ ruff check + pyright 通过
