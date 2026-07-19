# PRD-003: 繁殖可视化树

> Status: Draft · Author: AI Agent · Updated: 2026-07-19  
> Epic Lead: TBD · Dependencies: PRD-000 (breeding.json 数据), PRD-001 (卡片引用)

---

## 1. 概述

将 Palworld 的繁殖系统从"黑盒计算器"升级为**可视化基因图谱**。用户不仅能看到配对结果，还能看到多代繁殖路线、回交推演、最优路径规划——这是当前所有竞品都没有的功能。

## 2. 用户故事

```
US-001: 我选择两只帕鲁作为父母，看到它们的子代
US-002: 我选择一个目标帕鲁，看到所有可能的父代组合
US-003: 我拖拽繁殖树中的节点，重新计算下一代
US-004: 我想要从某只帕鲁出发，经过 N 代繁殖到目标帕鲁
US-005: 我只想看到带有某被动技能的繁殖路线
US-006: 我输入我已有的帕鲁池，AI 自动规划最优繁殖路线
US-007: 繁殖树可以导出为图片分享
```

## 3. 功能规格

### 3.1 核心功能矩阵

| 模式 | 输入 | 输出 |
|------|------|------|
| 父代→子代 | 两只帕鲁 | 子代帕鲁卡片（含繁殖力计算过程） |
| 子代→父代 | 目标帕鲁 | 所有父代组合列表 + 按繁殖力排序 |
| 多代推演 | 起始帕鲁 + 目标帕鲁 | N 代繁殖路线树图 |
| 回交模拟 | 起始帕鲁 + 任意子代 | 继续繁殖的连续路线 |
| 最优路径 | 已有帕鲁池 + 目标 | AI 规划的最短路线 |
| 批量筛选 | 过滤条件（类型/技能） | 符合条件的帕鲁繁殖链 |

### 3.2 繁殖树可视化设计

```
                    ┌─────────┐
                    │ Anubis  │  ← 根节点 (起始帕鲁)
                    │ 冥王犬   │
                    │ 570     │  ← 繁殖力数值
                    └────┬────┘
                         │
              ┌──────────┼──────────┐
              │          │          │
         ┌────▼────┐  ┌─▼──┐  ┌───▼───┐
         │ Arsox   │  │ ...│  │ B      │  ← 第一代子代
         │ 795     │  │    │  │        │
         └────┬────┘  └────┘  └───────┘
              │
         ┌────▼────┐
         │ Univolt │  ← 回交 Anubis → 第二代
         │ 680     │
         └────┬────┘
              │
         ┌────▼────┐
         │ Bushi   │  ← 第三代
         │ 625     │
         └────┬────┘
              │
         ┌────▼────┐
         │ Inciner │  ← 第四代
         │ 590     │
         └────┬────┘
              │
         ┌────▼────┐
         │ Anubis  │  ← 第五代回到目标
         │ 570     │     最优路线达成！✅
         └─────────┘

交互特性:
├── 🖱️ 节点可点击 → 展开帕鲁详情卡片
├── 🔄 拖拽重连 → 重新计算分支
├── 📏 缩放/平移 → 处理复杂树
├── 🎨 颜色编码 → 繁殖力梯度 (红→黄→绿)
└── 🔍 高亮路径 → AI 推荐的最优路线
```

### 3.3 繁殖路线规划算法

```
输入: 已有帕鲁池 Set<Pal>, 目标帕鲁 Target
输出: 最短繁殖路线 List<BreedingStep>

算法: BFS + 剪枝

1. 从目标帕鲁反向搜索父代组合
2. 用 BFS 找到从已有帕鲁到目标的最短路径
3. 剪枝:
   - 排除繁殖力高于已有帕鲁的节点（不可能得到）
   - 每代只保留 Top-3 最优路径
   - 最大深度限制 10 代
4. 返回 Top-3 最短路线

扩展:
- 加入被动技能过滤：如果用户想要"脑筋+传说"，
  优先推荐途径有这些技能的帕鲁
```

### 3.4 数据结构扩展

```typescript
interface BreedingNode {
  pal: PalCardData
  breedingPower: number
  generation: number
  children: BreedingNode[]
  parents?: [PalCardData, PalCardData]  // 本节点是如何产生的
  isOptimal?: boolean                    // AI 推荐标记
  isOwned?: boolean                      // 用户已持有
}

interface BreedingPath {
  steps: BreedingStep[]
  totalGenerations: number
  totalBreedingPower: number
  confidence: 'exact' | 'estimated'    // 精确组合 vs 估计
}

interface BreedingStep {
  parent1: PalCardData
  parent2: PalCardData
  child: PalCardData
  generation: number
  formula: string  // "⌊(570 + 1015 + 1) / 2⌋ = 793"
}
```

## 4. 交互设计

### 4.1 繁殖计算器页面布局

```
┌──────────────────────────────────────────────────┐
│  🌳 繁殖计算器                                    │
├────────────┬─────────────────────────────────────┤
│            │                                     │
│  [输入区]   │          [结果区]                    │
│            │                                     │
│  父代 1    │     ┌───────────────────┐            │
│  [选择▾]   │     │   结果帕鲁卡片      │            │
│            │     │                   │            │
│  父代 2    │     │   Anubis          │            │
│  [选择▾]   │     │   繁殖力: 570      │            │
│            │     │   计算公式:        │            │
│  [交换]    │     │   ⌊(570+1460+1)/2⌋ │            │
│            │     │   = 1015 → 取最近  │            │
│  或:       │     └───────────────────┘            │
│  目标帕鲁   │                                     │
│  [选择▾]   │     [🐣 多代推演] [📋 所有组合]     │
│            │                                     │
│  [拥有帕鲁] │                                     │
│  + 添加    │                                     │
│            │                                     │
├────────────┴─────────────────────────────────────┤
│                                                  │
│  [多代繁殖树可视化区域]                             │
│                                                  │
│  ┌─ Anubis ─┬─ Arsox ─┬─ Univolt ─┬─ ... ─┐     │
│  │          │         │           │        │     │
│  │          │         │           │ 目标!  │     │
│  └──────────┴─────────┴───────────┴────────┘     │
│                                                  │
│  [导出图片] [分享链接] [保存路线]                  │
└──────────────────────────────────────────────────┘
```

### 4.2 特殊组合处理

28 种特殊繁殖组合（不遵循繁殖力公式）需要特殊处理：

```typescript
const SPECIAL_COMBOS: Record<string, { parent1: string, parent2: string, child: string }> = {
  "Relaxaurus+Sparkit": { child: "Relaxaurus Lux" },
  "Incineram+Maraith": { child: "Incineram Noct" },
  "Vanwyrm+Foxcicle": { child: "Vanwyrm Cryst" },
  "Frostallion+Helzephyr": { child: "Frostallion Noct" },
  // ... 共 28 组
}
```

在 UI 中，特殊组合用特殊徽章表示：`✨ 特殊组合 (不遵循繁殖力公式)`

## 5. 验收标准

| ID | 标准 | 测试方式 |
|----|------|---------|
| AC-001 | 父代→子代查询覆盖 breeding.json 所有组合 | JSON 逐条断言 |
| AC-002 | 子代→父代查询返回全部合法组合 | 自动化测试 |
| AC-003 | 特殊组合独立处理，不落入公式计算 | 自动化测试 |
| AC-004 | 多代推演 BFS 算法在 100ms 内返回结果 | 性能测试 |
| AC-005 | 繁殖树可视化支持 100+ 节点不卡顿 | 性能测试 |
| AC-006 | 繁殖树导出图片清晰可读 | 手动测试 |
| AC-007 | 移动端繁殖树可缩放/平移 | Playwright 多设备 |

## 6. 技术实现

```typescript
// 核心算法 — 繁殖力计算公式
function calculateOffspring(p1: Pal, p2: Pal): Pal {
  // 先检查特殊组合
  const specialKey = [p1.name, p2.name].sort().join('+')
  if (SPECIAL_COMBOS[specialKey]) {
    return pals.find(p => p.name === SPECIAL_COMBOS[specialKey].child)
  }
  
  // 常规繁殖力公式
  const avg = Math.floor((p1.breeding.rank + p2.breeding.rank + 1) / 2)
  return findClosestPal(avg, [p1.key, p2.key])
}

function findClosestPal(value: number, excludeKeys: string[]): Pal {
  return pals
    .filter(p => !excludeKeys.includes(p.key))
    .sort((a, b) => 
      Math.abs(a.breeding.rank - value) - Math.abs(b.breeding.rank - value)
    )[0]
}

// 多代推演 — BFS
function findBreedingPath(
  ownedPals: Pal[],
  target: Pal,
  maxGenerations: number = 10
): BreedingPath[] {
  // BFS 从已拥有帕鲁出发，搜索到目标的最短路径
  const queue = ownedPals.map(p => ({ path: [p], generation: 0 }))
  const visited = new Set<string>()
  const results: BreedingPath[] = []
  
  while (queue.length > 0 && results.length < 3) {
    const { path, generation } = queue.shift()!
    const current = path[path.length - 1]
    
    if (current.key === target.key) {
      results.push({ steps: pathToSteps(path), totalGenerations: generation })
      continue
    }
    
    if (generation >= maxGenerations) continue
    
    // 尝试与所有已拥有帕鲁繁殖
    for (const mate of ownedPals) {
      if (mate.key === current.key) continue
      const child = calculateOffspring(current, mate)
      const key = `${child.key}@${generation + 1}`
      if (visited.has(key)) continue
      visited.add(key)
      queue.push({ path: [...path, child], generation: generation + 1 })
    }
  }
  
  return results.slice(0, 3)
}
```

## 7. 风险与缓解

| 风险 | 缓解 |
|------|------|
| 繁殖组合数据量过大 (38K+) | 构建时预计算索引，运行时 O(1) 查询 |
| 树的节点过多导致渲染卡顿 | 虚拟化 + 懒展开（默认显示首3代） |
| 特殊组合更新（游戏版本更新） | 数据同步脚本自动检测变更 |
| 用户输入复杂导致 BFS 爆炸 | 最大深度限制 + Top-3 剪枝 |

## 8. 依赖

- D3.js 或 React Flow（树图可视化）
- Framer Motion（节点动画）
- html-to-image（导出为图片）
- TanStack React Query（数据缓存）
