# 006-pal-card

## Status
- status: pending
- assigned_to: cursor
- depends_on: []

## Goal

创建帕鲁卡牌组件体系，包含基础卡片、属性徽章、工作适性显示、悬停动效。

## Files
- Create: `frontend/src/components/pal-card.tsx`
- Create: `frontend/src/components/element-badge.tsx`
- Create: `frontend/src/components/work-badge.tsx`
- Create: `frontend/src/components/pal-card.test.tsx`

## Acceptance Criteria
- [ ] 卡片渲染帕鲁名（双语）、元素类型、工作适性
- [ ] 元素类型徽章使用 TOKENS.md 定义的颜色（如 火=#FF6B35）
- [ ] 悬停时卡片上浮 + 阴影加深 (Framer Motion spring)
- [ ] 工作适性用图标 + 等级点阵显示
- [ ] 稀有度星级用金色渐变显示
- [ ] 卡片渐进式披露：默认展示名称+类型+工作，悬停展开属性条
- [ ] TypeScript strict 模式通过
- [ ] 测试通过

## Implementation Hints
- 组件 Props 类型参照 PRD-001 中的 PalCardData 接口
- 稀有度色值从 `docs/design/TOKENS.md` 的 `--color-rarity-*` 取
- 动画使用 Framer Motion spring presets（参考 TOKENS.md 的 spring 章节）
- 使用 Tailwind CSS v4 的 `@theme` 指令引用设计 Token
- 元素图标用 Lucide React（fire, droplet, leaf, zap, snowflake, mountain, moon, gem）
