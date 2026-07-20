# 009-breeding-calc

## Status
- status: pending
- assigned_to: cursor
- depends_on: [006, 008]

## Goal

创建繁殖计算器页面，包含父代→子代查询、子代→父代反向查询、多代推演树图。

## Files
- Create: `frontend/src/app/breeding/page.tsx`
- Create: `frontend/src/components/breeding-calc.tsx`
- Create: `frontend/src/components/breeding-tree.tsx`
- Create: `frontend/src/components/breeding-calc.test.tsx`

## Acceptance Criteria
- [ ] 父代→子代：选两只帕鲁显示子代 + 繁殖力计算公式
- [ ] 子代→父代：选目标帕鲁显示所有父代组合
- [ ] 特殊组合以紫色徽章标注"✨ 特殊组合"
- [ ] 多代推演：从起始帕鲁 + 目标帕鲁生成繁殖路线树
- [ ] 繁殖树节点可点击查看帕鲁卡片
- [ ] 被动技能遗传提示（如果有技能池输入）
- [ ] 移动端可缩放/拖拽树图
- [ ] 测试通过

## Implementation Hints
- 繁殖计算走后端 API（已实现），前调用:
  - `GET /api/v1/breeding/calculate?parent1=X&parent2=Y`
  - `GET /api/v1/breeding/reverse?target=X`
- 首次加载时从 `src/data/breeding.json` 读取组合数据做本地缓存加速
- 帕鲁选择器用 `<SearchBar>` 组件的选择模式（只选不搜）
- 结果展示复用 `<PalCard>` 组件放子代
- 树图可视化 Phase 2 用 React Flow，Phase 1 只用列表展示路径
