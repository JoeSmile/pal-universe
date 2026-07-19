# 013-api-breeding

## Status
- status: pending
- assigned_to: hermes
- depends_on: [012]

## Goal

实现繁殖计算 API（正向、反向、多代推演），从 pgvector 读取数据。

## Files
- Create: `backend/app/api/v1/breeding.py`
- Modify: `backend/app/api/v1/api.py`（注册路由）

## Acceptance Criteria
- [ ] `GET /api/v1/breeding/calculate?parent1=Penking&parent2=Vanwyrm%20Cryst` 返回 Anubis
- [ ] 特殊组合（Relaxaurus + Sparkit → Relaxaurus Lux）正确处理
- [ ] `GET /api/v1/breeding/reverse?target=Anubis` 返回所有父代组合
- [ ] 无效帕鲁名返回 `BREEDING.CALCULATE.INVALID_PARENT`
- [ ] 无组合返回 `BREEDING.REVERSE.NO_COMBOS`
- [ ] ruff check 通过
