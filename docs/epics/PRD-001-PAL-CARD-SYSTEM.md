# PRD-001: 帕鲁卡牌系统

> Status: Draft · Author: AI Agent · Updated: 2026-07-19  
> Epic Lead: TBD · Dependencies: PRD-000

---

## 1. 概述

构建 Pal Universe 的视觉核心——**帕鲁卡牌系统**。这不是普通的数据展示，而是 TCG（集换式卡牌游戏）级别的交互式卡牌 UI，是 Pal Universe 最直观的门面和品牌标识。

## 2. 用户故事

```
作为一名玩家，我想：
US-001: 在首页看到热门帕鲁的漂亮卡片墙，一眼就能被吸引
US-002: 点击卡片看到帕鲁的完整详情（属性/技能/掉落/繁殖/位置）
US-003: 悬停卡片时看到微交互动效（光效/旋转/粒子）
US-004: 选中两只帕鲁，并排对比它们的属性差异
US-005: 按属性/工作/稀有度筛选帕鲁，筛选过程有平滑动画
US-006: 在移动端也能流畅浏览卡片，不会卡顿或布局错乱
US-007: 从 AI Chat 的结果中直接点击帕鲁名字跳转到卡片详情
```

## 3. 功能规格

### 3.1 卡片组件体系

```
PalCard                    ← 基础卡片组件
├── PalCardGrid            ← 网格布局容器 (响应式)
├── PalCardList            ← 列表布局容器 (详情模式)
├── PalCardCompare         ← 对比模式 (2-4张并排)
├── PalCardDetail          ← 全屏详情弹窗/页面
├── PalCardSkeleton        ← 加载骨架屏
└── PalCardEmpty           ← 空状态
```

### 3.2 卡片设计规格

```
┌──────────────────────────────────┐
│  [元素光泽背景 - 依类型变色]      │
│                                  │
│      🎴 帕鲁立绘/图标             │  ← 悬停时放大 + 光晕
│         (带光影效果)              │
│                                  │
│  ════════════════════════════    │
│                                  │
│  Anubis              ⭐⭐⭐⭐     │  ← 名称 + 稀有度星级
│  冥王犬                         │  ← 中文名
│                                  │
│  🔥 火   🌑 暗                   │  ← 属性徽章 (带脉冲动画)
│                                  │
│  工作适性:                        │
│  ⛏️ 采矿 Lv3  🪵 伐木 Lv2       │  ← 带图标 + 等级点阵
│  🔧 手工 Lv2  🚚 搬运 Lv2       │
│                                  │
│  基础属性 (悬停展开):              │
│  HP   ████████░░░░ 140          │  ← 微动效进度条
│  ATK  ██████░░░░░░ 100          │     悬停时流动光效
│  DEF  █████████░░░ 135          │
│                                  │
│  [🐣 繁殖] [🗺️ 位置] [💬 问AI]   │  ← 快捷操作按钮
└──────────────────────────────────┘

规格: 280px × 420px (桌面) 
       自适应 (移动端)
```

### 3.3 动效规格

| 交互 | 动画 | 实现 |
|------|------|------|
| 页面进入 | 卡片从底部浮入，stagger 50ms | Framer Motion `initial→animate` |
| 悬停 | 卡片轻微上浮 + 阴影加深 + 光晕扩散 | CSS transform + box-shadow |
| 筛选 | 卡片以网格布局动画折叠/展开 | Framer Motion `layout` |
| 展开详情 | 卡片弹性放大过渡 (spring) | Framer Motion spring physics |
| 属性徽章 | 呼吸脉冲 (2s 周期) | CSS keyframes |
| 属性条 | 从 0 填充到目标值的动画 | IntersectionObserver + CSS transition |
| 对比模式 | 并排滑动入场 + 差异高亮变色 | Framer Motion + 颜色差值计算 |

### 3.4 响应式断点

| 断点 | 列数 | 卡片尺寸 |
|------|------|---------|
| < 640px (手机) | 2列 | 自适应 |
| 640-1024px (平板) | 3-4列 | 220px |
| 1024-1440px (桌面) | 4-5列 | 260px |
| > 1440px (宽屏) | 5-6列 | 280px |

## 4. 数据需求

```typescript
interface PalCardData {
  id: number
  key: string
  name: string
  nameCn: string            // 中文名
  types: ElementType[]      // 元素类型
  image: string             // 卡片图 URL
  thumbnail: string         // 缩略图 URL (列表用)
  
  workSuitability: Array<{
    type: WorkType
    level: 1 | 2 | 3 | 4
  }>
  
  stats: {
    hp: number
    attack: { melee: number; ranged: number }
    defense: number
    speed: { ride: number; run: number; walk: number }
    stamina: number
    food: number
  }
  
  rarity: 1 | 2 | 3 | 4 | 5    // 稀有度星级
  size: Size
  drops: string[]
  
  breedingRank: number         // 繁殖力 (用于卡面显示)
}
```

## 5. UI/UX 设计原则

1. **游戏感** — 色彩、光效、动效借鉴 Palworld 游戏内 UI 风格（暗紫+金+青蓝）
2. **信息层级** — 名称 > 属性 > 工作适性 > 战斗属性，按重要性递减排列
3. **一致性** — 所有卡片使用同一套设计语言，变体仅通过颜色/图标区分
4. **性能优先** — 动画使用 GPU 加速属性 (transform/opacity)，不触发重排
5. **无障碍** — 所有交互元素有 focus 状态，动效支持 `prefers-reduced-motion`

## 6. 验收标准

| ID | 标准 | 测试方式 |
|----|------|---------|
| AC-001 | 所有帕鲁展示在卡片网格中，数据渲染正确 | E2E 截图对比 |
| AC-002 | 筛选器按属性/工作/稀有度工作正常 | 单元测试 |
| AC-003 | 搜索框输入 2 字符后开始搜索，500ms 内展示结果 | 性能测试 |
| AC-004 | 卡片悬停动画流畅，无卡顿 (60fps) | 性能 Profiler |
| AC-005 | 移动端 2 列布局，卡片自适应无溢出 | Playwright 多设备 |
| AC-006 | 对比模式选中 2/3/4 张卡片都能正确显示差异 | 单元 + E2E |
| AC-007 | 从 AI Chat 点击帕鲁名称能正确跳转详情页 | E2E 用户流程 |

## 7. 技术实现要点

```typescript
// 关键实现方案

// 动画性能优化 — 使用 GPU 加速
const CardWrapper = styled.div`
  will-change: transform, opacity;
  transform: translateZ(0);    /* 强制 GPU 合成层 */
`

// 筛选动画 — Framer Motion layout
<AnimatePresence>
  {filteredPals.map(pal => (
    <motion.div
      layout                              // 自动动画布局变化
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <PalCard data={pal} />
    </motion.div>
  ))}
</AnimatePresence>

// 懒加载 — 虚拟滚动 (列表模式)
// 使用 @tanstack/react-virtual 处理 300+ 帕鲁列表
```

## 8. 风险与缓解

| 风险 | 缓解 |
|------|------|
| 300+ 帕鲁卡片同时渲染导致性能问题 | 虚拟滚动 + 图片懒加载 + 分页 |
| Framer Motion 动画在低端设备卡顿 | 检测帧率，动态降低动画复杂度 |
| 图片加载慢 | next/image + WebP + 渐进式加载 |
| 中文名/翻译不准确 | 社区驱动 + 手动审核 + 可配置 |

## 9. 依赖

- Framer Motion v11+（动画引擎）
- Radix UI Tooltip / Dialog / Popover（交互组件）
- TanStack React Query（数据缓存）
- clsx + tailwind-merge（样式工具）
- Lucide React + react-icons（图标库）
