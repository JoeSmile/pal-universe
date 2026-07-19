# Pal Universe 设计 Token

> 本文档定义 Pal Universe 的视觉设计系统。
> 所有 UI 组件必须使用这里定义的 Token 值，不得硬编码颜色/间距/字体。

---

## 一、配色体系

### 1.1 基础色板（oklch）

```css
:root {
  /* ── 背景层 ── */
  --color-bg-base: oklch(10% 0.01 280);          /* #12131A — 最深背景 */
  --color-bg-surface: oklch(14% 0.015 280);        /* #1C1D26 — 卡片/面板 */
  --color-bg-elevated: oklch(18% 0.02 280);        /* #262836 — 弹窗/下拉 */
  --color-bg-hover: oklch(22% 0.025 280);          /* #30334A — 悬停态 */
  --color-bg-inset: oklch(10% 0.01 280);           /* #12131A — 输入框内部 */

  /* ── 文字 ── */
  --color-text-primary: oklch(93% 0.01 280);       /* #E8E9F0 — 主文字 */
  --color-text-secondary: oklch(60% 0.03 280);      /* #888AA0 — 次要文字 */
  --color-text-tertiary: oklch(45% 0.03 280);       /* #686A82 — 占位符/禁用 */
  --color-text-inverse: oklch(14% 0.015 280);       /* #1C1D26 — 亮色背景上的文字 */
  --color-text-link: oklch(65% 0.18 280);           /* #7C7CFF — 链接 */

  /* ── 边框/分割线 ── */
  --color-border: oklch(22% 0.02 280);             /* #30334A */
  --color-border-hover: oklch(30% 0.03 280);        /* #44476A */
  --color-border-active: var(--color-accent);

  /* ── 强调色 (紫) ── */
  --color-accent: oklch(60% 0.22 280);              /* #7C5CFC */
  --color-accent-hover: oklch(65% 0.22 280);        /* #9474FF */
  --color-accent-glow: oklch(60% 0.22 280 / 25%);   /* 光晕效果 */
  --color-accent-muted: oklch(30% 0.15 280);        /* 弱化强调 */

  /* ── 语义色 ── */
  --color-success: oklch(60% 0.18 150);             /* #34D399 */
  --color-warning: oklch(70% 0.18 80);              /* #FBBF24 */
  --color-danger: oklch(55% 0.2 30);                 /* #F87171 */
  --color-info: var(--color-accent);
}
```

### 1.2 元素属性色（Palworld 九种元素）

这些颜色用于帕鲁的属性徽章、分类标签、元素滤镜。

```css
:root {
  --color-element-fire: oklch(65% 0.25 40);          /* 火 — 橙红 #FF6B35 */
  --color-element-water: oklch(60% 0.18 240);        /* 水 — 蓝 #3B82F6 */
  --color-element-grass: oklch(60% 0.22 140);        /* 草 — 绿 #22C55E */
  --color-element-electric: oklch(70% 0.2 95);       /* 电 — 黄 #EAB308 */
  --color-element-ice: oklch(75% 0.1 200);           /* 冰 — 青 #67E8F9 */
  --color-element-ground: oklch(55% 0.12 80);        /* 地 — 棕 #A16207 */
  --color-element-dark: oklch(45% 0.15 300);          /* 暗 — 紫 #7C3AED */
  --color-element-dragon: oklch(60% 0.18 330);        /* 龙 — 粉紫 #C084FC */
  --color-element-neutral: oklch(70% 0.02 280);       /* 无 — 白灰 #A1A1AA */

  /* 每种元素的文字色（在对应色块上的文字） */
  --color-element-fire-text: oklch(98% 0.01 40);
  --color-element-water-text: oklch(98% 0.01 240);
  --color-element-grass-text: oklch(98% 0.01 140);
  --color-element-electric-text: oklch(10% 0.01 95);
  --color-element-ice-text: oklch(10% 0.01 200);
  --color-element-ground-text: oklch(98% 0.01 80);
  --color-element-dark-text: oklch(98% 0.01 300);
  --color-element-dragon-text: oklch(98% 0.01 330);
  --color-element-neutral-text: oklch(10% 0.01 280);
}
```

### 1.3 稀有度色

```css
:root {
  --color-rarity-1: oklch(60% 0.03 280);           /* 普通 — 灰 */
  --color-rarity-2: oklch(65% 0.15 150);           /* 稀有 — 绿 */
  --color-rarity-3: oklch(70% 0.18 240);           /* 史诗 — 蓝 */
  --color-rarity-4: oklch(70% 0.2 280);            /* 传说 — 紫 */
  --color-rarity-5: oklch(75% 0.2 80);              /* 神话 — 金 */
}
```

---

## 二、字体体系

| Token | 值 | 用途 |
|-------|-----|------|
| `--font-sans` | `'Inter', system-ui, -apple-system, sans-serif` | 正文字体 |
| `--font-mono` | `'JetBrains Mono', 'Fira Code', monospace` | 代码/数字 |

### 2.1 字号

```css
:root {
  --text-xs: 0.75rem;   /* 12px — 辅助文字 */
  --text-sm: 0.875rem;  /* 14px — 正文次要 */
  --text-base: 1rem;    /* 16px — 正文 */
  --text-lg: 1.125rem;  /* 18px — 正文强调 */
  --text-xl: 1.25rem;   /* 20px — 小标题 */
  --text-2xl: 1.5rem;   /* 24px — 卡片标题 */
  --text-3xl: 2rem;     /* 32px — 页面标题 */
  --text-4xl: 2.5rem;   /* 40px — Hero 标题 */
  --text-5xl: 3rem;     /* 48px — 大 Hero */
}
```

### 2.2 行高

```css
:root {
  --leading-tight: 1.15;    /* 标题 */
  --leading-normal: 1.5;    /* 正文 */
  --leading-relaxed: 1.7;   /* 长文 */
}
```

### 2.3 字重

| Token | 值 | 用途 |
|-------|-----|------|
| `--weight-normal` | 400 | 正文 |
| `--weight-medium` | 500 | 按钮/标签 |
| `--weight-semibold` | 600 | 小标题 |
| `--weight-bold` | 700 | 大标题 |

---

## 三、间距体系

4px 基准，二倍递增：

```css
:root {
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
}
```

---

## 四、圆角

```css
:root {
  --radius-none: 0;
  --radius-sm: 0.25rem;    /* 4px — 按钮/输入框 */
  --radius-md: 0.5rem;     /* 8px — 卡片 */
  --radius-lg: 0.75rem;    /* 12px — 弹窗 */
  --radius-xl: 1rem;       /* 16px — 大卡片 */
  --radius-2xl: 1.5rem;    /* 24px — 模态框 */
  --radius-full: 9999px;   /* 圆形 — 徽章/头像 */
}
```

---

## 五、阴影

```css
:root {
  --shadow-sm: 0 1px 2px oklch(0% 0 0 / 10%);         /* 低 — 卡片悬停 */
  --shadow-md: 0 4px 6px oklch(0% 0 0 / 15%);         /* 中 — 弹窗 */
  --shadow-lg: 0 10px 15px oklch(0% 0 0 / 20%);       /* 高 — 模态框 */
  --shadow-xl: 0 20px 25px oklch(0% 0 0 / 25%);       /* 最高 — 通知 */
  --shadow-glow-accent: 0 0 20px var(--color-accent-glow); /* 强调色发光 */
}
```

---

## 六、动画时长

```css
:root {
  --duration-fast: 150ms;    /* 悬停/点击反馈 */
  --duration-normal: 250ms;  /* 面板展开/收起 */
  --duration-slow: 400ms;    /* 页面过渡 */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
}
```

弹簧动画（Framer Motion 使用）：

```typescript
// framer-motion spring presets
export const spring = {
  stiff: { type: "spring", stiffness: 300, damping: 25 },    // 卡片悬停
  bouncy: { type: "spring", stiffness: 400, damping: 15 },   // 弹窗出现
  gentle: { type: "spring", stiffness: 200, damping: 30 },   // 列表项进入
}
```

---

## 七、与 Tailwind CSS v4 集成

在 `src/app/globals.css` 中 `@import` Token 文件，然后使用 Tailwind v4 的 `@theme` 指令：

```css
@import "./tokens.css";

@theme {
  --color-bg-base: var(--color-bg-base);
  --color-bg-surface: var(--color-bg-surface);
  --color-accent: var(--color-accent);
  --color-element-fire: var(--color-element-fire);
  /* ... 其他颜色映射 */
}
```

**不要在 JSX 中直接引用 CSS 变量名。** 使用 Tailwind 类名：
- Bad: `style={{ backgroundColor: 'var(--color-accent)' }}`
- Good: `className="bg-accent"`

---

## 八、Design Rationale

**为什么用暗色主题？**
1. Palworld 游戏本身有暗色调的 UI 元素
2. 暗色背景让帕鲁的高清图更加凸显
3. 竞品（paldb.cc）用白色背景，暗色是差异化

**为什么强调色用紫色？**
- 紫色在游戏社区中代表"稀有/史诗"
- 与帕鲁的 9 种元素色不冲突
- Linear.app 的紫色基调验证了这个选择

**为什么元素色沿用游戏内配色？**
玩家对"火=橙红、水=蓝"有肌肉记忆，改色会导致认知偏差。
