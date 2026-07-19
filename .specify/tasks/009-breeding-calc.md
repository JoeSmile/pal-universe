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
- 繁殖计算核心逻辑放在前端（不依赖后端 API），数据从静态 JSON 加载
- 算法实现：父代→子代用组合表查找，子代→父代用反向索引
- 特殊组合 28 组硬编码（参考 PRD-003 的表格）
- 树图可视化用 React Flow 或纯 CSS + Framer Motion（不引入 D3.js 减少依赖）
- 繁殖力公式显示清晰：`⌊(570 + 1460 + 1) / 2⌋ = 1015 → Robinquill`
