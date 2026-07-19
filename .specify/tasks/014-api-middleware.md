# 014-api-middleware

## Status
- status: pending
- assigned_to: hermes
- depends_on: []

## Goal

实现 API 中间件层：审计日志、成本追踪、熔断检查。

## Files
- Create: `backend/app/core/audit.py`
- Create: `backend/app/core/cost_tracker.py`
- Modify: `backend/app/core/middleware.py`

## Acceptance Criteria
- [ ] 所有非 `/health` 请求记录审计日志（method/path/ip/status/duration）
- [ ] Chat 请求额外记录 token 消耗
- [ ] 熔断器检测到单 IP 超预算返回 429 BUDGET_EXCEEDED
- [ ] 审计日志写入文件，按天轮转
- [ ] ruff check 通过
