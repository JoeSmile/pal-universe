# 007-pal-list

## Status
- status: in_progress
- assigned_to: cursor
- depends_on: [006]
- started_at: 2026-07-19

## Goal

创建帕鲁列表页，包含响应式卡片网格、筛选器、搜索集成。

## Files
- Create: `frontend/src/app/pals/page.tsx`
- Create: `frontend/src/components/pal-card-grid.tsx`
- Create: `frontend/src/components/pal-filter.tsx`
- Create: `frontend/src/components/pal-card-grid.test.tsx`

## Acceptance Criteria
- [ ] 网格布局响应式：手机 2 列 / 平板 3-4 列 / 桌面 5-6 列
- [ ] 筛选器支持按 9 种元素类型过滤
- [ ] 筛选器支持按 12 种工作适性过滤
- [ ] 筛选动画使用 Framer Motion layout 动画
- [ ] 筛选结果计数实时更新
- [ ] 图片懒加载（next/image）
- [ ] 移动端触控流畅无卡顿
- [ ] 测试通过

## Implementation Hints
- 帕鲁列表数据先硬编码在前端 JSON 中（从 palworld-kb 的 pals_combat.json 提取）
- 筛选使用 Zustand store 管理状态
- 引用 Task 006 的 PalCard 组件
- 空结果显示"没有找到匹配的帕鲁" + 清除筛选按钮
- 参考 PRD-001 的响应式断点设计
