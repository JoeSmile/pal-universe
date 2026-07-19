# 011-homepage-enhance

## Status
- status: pending
- assigned_to: cursor
- depends_on: [005, 006]

## Goal

将首页从"纯搜索框"升级为"智能搜索+AI Chat 一体化 + 拼写纠错 + 功能入口 + 热门帕鲁"的全功能首页。

## Files
- Modify: `frontend/src/components/home-search-section.tsx`
- Modify: `frontend/src/lib/search-pals.ts`
- Create: `frontend/src/components/quick-links.tsx`
- Create: `frontend/src/components/hot-pals.tsx`
- Create: `frontend/src/components/quick-links.test.tsx`

## Acceptance Criteria

### 搜索 + AI Chat 一体化（智能路由）
- [ ] 一个输入框，根据输入自动判断意图：

```
输入模式                      → 行为
──────────────────────────────────────────────
短词 1-5 字符 (如 "Anubis")   → 本地搜索帕鲁 + 拼写纠错
长句/问题 (如 "怎么打暗系BOSS") → 按 Enter 进 AI Chat
搜不到但有接近匹配            → 显示 "您是不是要找: XXX"
```

- [ ] 输入 1 字符后开始本地搜索
- [ ] 搜索下拉底部显示 "按 Enter 问 AI 更多" 入口
- [ ] 进入 Chat 模式后显示对话气泡，支持 SSE 流式（mock 模式）

### 拼写纠错（模糊匹配）
- [ ] Levenshtein 编辑距离算法，距离 ≤ 2 时触发
- [ ] 搜索无结果时显示 "🤔 您是不是要找: XXX"
- [ ] 纠错建议展示完整帕鲁名 + 属性 + 稀有度星级
- [ ] 点击纠错建议直接搜索正确帕鲁名

### 快捷功能入口
- [ ] 桌面端 3 列网格，移动端 2 列网格
- [ ] 6 个入口：繁殖计算器 / 属性克制 / 地图 / AI 助手 / Tier 排行 / 物品图鉴
- [ ] 每个入口有图标 + 文字 + 点击跳转

### 热门帕鲁
- [ ] 桌面端 4-8 张网格展示
- [ ] 移动端横向滑动（overflow-x-auto + snap-x）
- [ ] 展示帕鲁名 + 元素属性 + 稀有度
- [ ] 数据从 pals.json 按稀有度排序取前 8

### 响应式
- [ ] 桌面：搜索居中 → 快捷入口(3列) → 热门帕鲁(网格)
- [ ] 移动端：搜索顶部 → Chat → 快捷入口(2列) → 热门帕鲁(横滑)

### 质量
- [ ] TypeScript type-check 通过
- [ ] 测试通过
- [ ] Build 通过

## 攻略类问题的处理

攻略类问题（"前期抓什么好"、"怎么配火队"）不走搜索，直接走 AI Chat：
- 输入 > 8 字符 或 包含疑问词（怎么/如何/什么）→ 判定为 Chat
- Chat 响应通过 embedding + pgvector 检索知识库
- mock 模式下预设几条常见攻略回答

## Implementation Hints
- `hot-pals.tsx` 从 `pals.json` 读取，按 rarity 降序取前 8
- 移动端横滑：`flex overflow-x-auto snap-x snap-mandatory scrollbar-hide`
- 拼写纠错 UI 参考 Google 搜索的"您是不是要找"样式
- 快捷入口图标：`LuSplit`(繁殖) `LuFlame`(属性) `LuMap`(地图) `LuBot`(AI) `LuStar`(Tier) `LuPackage`(物品)
- Chat mock 模式：预设 5 条常见攻略回答 + SSE 模拟逐字输出

### 搜索优化策略（性能关键）

搜索分两层，不要一上来就算 Levenshtein。**前缀匹配 0 结果时才触发纠错：**

```typescript
// search-pals.ts
function searchPals(query: string, pals: PalName[]): PalSearchResult[] {
  const q = query.toLowerCase().trim();

  // Step 1: 前缀匹配 (startsWith) — 0.01ms
  const prefixMatch = pals.filter(p => p.name.toLowerCase().startsWith(q));
  if (prefixMatch.length > 0) return prefixMatch;

  // Step 2: 前缀匹配 = 0 → Levenshtein 纠错 — ~0.5ms
  const MIN_DIST = 2;
  let best: PalName | null = null;
  let bestDist = Infinity;
  for (const pal of pals) {
    const dist = levenshtein(q, pal.name.toLowerCase());
    if (dist < bestDist && dist <= MIN_DIST) { bestDist = dist; best = pal; }
  }
  return best ? [{ ...best, isSuggestion: true }] : [];
}
```

**不需要预计算或缓存。** 299 帕鲁 × 前缀匹配 ≈ 0.01ms。Levenshtein 仅在极少数的拼写错误时才触发（用户输入前缀匹配不到任何帕鲁时），平均每几十次搜索才触发一次。
