# 004-design-tokens

## Status
- status: completed
- assigned_to: hermes
- depends_on: []
- completed_at: 2026-07-19

## Goal

定义 Pal Universe 的设计 Token 体系：颜色、字体、间距、圆角、阴影、动画时长。这是所有 UI 组件的基础，必须在写代码前确定。

## Files
- Create: `docs/design/TOKENS.md`

## Acceptance Criteria
- [x] 颜色体系包含：背景色阶、文字色阶、强调色、属性色（9种元素）、状态色
- [x] 字体体系包含：标题/正文/代码的字号、行高、字重
- [x] 间距体系包含：4px 基准的间距 scale（4/8/12/16/20/24/32/48/64）
- [x] 圆角体系包含：sm/md/lg/xl/full
- [x] 阴影体系包含：低/中/高 elevation
- [x] 动画时长包含：fast/normal/slow 对应的 ms 值
- [x] 提供 Tailwind CSS v4 的 CSS 变量定义格式
- [x] 提供 CSS 自定义属性和 `oklch` 颜色值

## Design Direction

**风格关键词：** 暗黑魔幻、游戏感、精致、信息层级清晰

**参考站点：**
- 主色调 → Linear.app 的暗色模式（深灰背景 + 精准白色文字）
- 卡片质感 → Framer 的毛玻璃卡片
- 数据展示 → Sentry 的暗色仪表盘
- 帕鲁元素色 → 沿用 Palworld 游戏内的九种元素色（火=橙红、水=蓝、草=绿、电=黄、冰=青、地=棕、暗=紫、龙=粉紫、无=白灰）

**不要参考：** Stripe 的紫渐变、Notion 的暖白、palworld.gg 的全白背景

## Output Template

```css
/* colors.css */
:root {
  --color-bg-base: oklch(12% 0.01 280);       /* 最深背景 */
  --color-bg-surface: oklch(16% 0.015 280);    /* 卡片/面板背景 */
  --color-bg-elevated: oklch(20% 0.02 280);    /* 弹窗/下拉背景 */
  --color-text-primary: oklch(95% 0.005 280);  /* 主文字 */
  --color-text-secondary: oklch(65% 0.02 280); /* 次要文字 */
  --color-accent: oklch(65% 0.2 280);          /* 强调色 (紫) */
  --color-accent-glow: oklch(65% 0.2 280 / 30%); /* 强调色光晕 */
  
  /* 元素属性色 */
  --color-element-fire: oklch(65% 0.25 40);
  --color-element-water: oklch(65% 0.15 240);
  --color-element-grass: oklch(65% 0.2 140);
  --color-element-electric: oklch(75% 0.2 100);
  --color-element-ice: oklch(75% 0.1 200);
  --color-element-ground: oklch(60% 0.1 80);
  --color-element-dark: oklch(50% 0.15 300);
  --color-element-dragon: oklch(65% 0.2 330);
  --color-element-neutral: oklch(70% 0.02 280);
}
```

## Implementation Hints
- 使用 `oklch` 色彩空间（Tailwind v4 原生支持，色域广且感知均匀）
- Token 文件用纯 CSS 变量定义，后续可以直接 `@import` 到 Tailwind 配置
- 配合 `skill_view(name="popular-web-designs", file_path="templates/linear.app.md")` 参考 Linear 的暗色体系
- 元素色要跟 Palworld 游戏内保持一致，避免玩家产生认知偏差
