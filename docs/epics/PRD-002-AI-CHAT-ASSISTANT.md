# PRD-002: AI 聊天助手

> Status: Draft · Author: AI Agent · Updated: 2026-07-19  
> Epic Lead: TBD · Dependencies: PRD-000, PRD-001 (卡片引用)

---

## 1. 概述

Pal Universe 的核心差异化功能——**智能聊天助手**。用户可以通过自然语言与 Palworld 数据库交互，查询帕鲁信息、繁殖方案、配队建议、攻略技巧等。这是现有竞品（paldb.cc、palworld.gg）都没有的功能。

## 2. 用户故事

```
US-001: 我问"Anubis 怎么繁殖？"，AI 告诉我所有父代组合，并显示繁殖树
US-002: 我问"哪些帕鲁适合挖矿？"，AI 列出最高采矿等级的帕鲁
US-003: 我描述"我想要一只带工蜂和采樵的帕鲁"，AI 推荐最佳选择
US-004: 我问"新手前期抓什么帕鲁好？"，AI 给出分阶段指南
US-005: 我粘贴一只帕鲁的名字，AI 告诉我它的全部信息
US-006: AI 回答中提到的帕鲁可以点击跳转到详情卡片
US-007: 我能看到 AI 回答引用的数据来源（可信透明）
US-008: 对话历史在本地保存，刷新页面不会丢失
US-009: 我问"当前版本最强配队"，AI 分析属性克制给出推荐
US-010: 我问"炎龙在哪抓"，AI 展示地图位置
```

## 3. 功能规格

### 3.1 聊天 UI 设计

```
┌──────────────────────────────────────┐
│  🤖 Pal Universe AI                  │
│  你的帕鲁专家助手                      │
├──────────────────────────────────────┤
│                                      │
│  [用户气泡]                           │
│  "怎么繁殖出 Jetragon？"              │
│                                      │
│  [AI 气泡]                            │
│  Jetragon 是 Palworld 的传说级帕鲁，    │
│  只能通过捕捉获得，无法通过繁殖得到。     │
│                                      │
│  位置: 第三禁猎区 (地图高亮)           │
│  [查看地图 →]                        │
│                                      │
│  [AI 气泡 - 快速操作]                 │
│  ┌──────────────────────────────┐   │
│  │ 🔥 查看 Jetragon 卡片        │   │
│  │ 🗺️ 打开地图位置              │   │
│  │ 📋 查看所有传说帕鲁           │   │
│  └──────────────────────────────┘   │
│                                      │
├──────────────────────────────────────┤
│  □□□□□□□□□□□□ 输入问题...  [发送]   │
│  💡 提示: 可以问我繁殖/配队/位置      │
└──────────────────────────────────────┘
```

### 3.2 对话类型与处理逻辑

| 用户意图 | 意图识别关键词 | 处理策略 | 响应格式 |
|---------|--------------|---------|---------|
| 帕鲁查询 | 名称 + 属性/技能/掉落 | JSON 直接查询 | 文本 + 卡片引用 |
| 繁殖查询 | 繁殖/生蛋/配种 + 帕鲁名 | 查 breeding.json | 文本 + 繁殖树 |
| 条件筛选 | 最高/最适合/最好 + 工作/属性 | JSON 聚合查询 | 列表 + 卡片 |
| 配队推荐 | 组队/配队 + 属性/用途 | 组合分析 + 属性克制 | 建议列表 |
| 位置查询 | 在哪/位置/坐标 + 帕鲁名 | 查 maps 数据 | 文本 + 地图跳转 |
| 攻略指南 | 新手/攻略/技巧 | RAG 知识库 | 分步骤指南 |
| 版本动态 | 新增/更新 + 版本号 | 版本 diff 对比 | 变更列表 |
| 闲聊/未知 | 其他 | LLM 通用回答 | 文本 |

### 3.3 系统提示词设计

```
你是一个 Palworld 专家助手，精通全部 {count} 只帕鲁的数据、
繁殖系统和游戏机制。

核心能力：
1. 帕鲁数据查询 —— 如名称、属性、技能、掉落物、工作适性、伙伴技能
2. 繁殖组合查询 —— 两只帕鲁配对的结果，或某目标帕鲁的父代组合
3. 条件筛选 —— 按属性/工作/稀有度筛选帕鲁
4. 配队推荐 —— 考虑属性克制、技能配合、工作分配
5. 位置指引 —— 帕鲁出现位置、Boss 位置

数据源：
- 帕鲁数据: data/pals.json ({count} 条)
- 繁殖组合: data/breeding.json (38K+ 组合)
- 位置数据: data/maps.json

回答规则：
1. 引用数据时标注来源（如：数据来自 Paldex API v1.3）
2. 提及帕鲁时用中文名+英文名（如：Anubis·冥王犬）
3. 复杂问题分点回答，关键信息加粗
4. 在回答末尾提供相关快捷操作按钮
5. 无法回答的问题诚实说明，不要编造
```

### 3.4 RAG 知识库构建

```
docs/knowledge-base/
├── pals/               ← 帕鲁百科（每只帕鲁一页）
├── breeding/           ← 繁殖机制 + 特殊组合
├── mechanics/          ← 游戏机制（属性克制/工作/建造）
├── guides/             ← 攻略（新手/进阶/Boss/速通）
├── version-history/    ← 版本更新记录
└── faq/               ← 常见问题
```

构建流程：

```
data/pals.json + breeding.json
    │
    ▼
scripts/build-knowledge.ts
    │
    ├─→ 将 JSON 转为人类可读的 Markdown 文档
    ├─→ 构建向量索引 (Embedding API)
    ├─→ 建立 FAQ 索引 (关键词→答案)
    │
    └─→ 输出: knowledge-base/*.md + vector-index.json
```

## 4. 技术架构

### 4.1 请求流程

```
用户输入
  │
  ▼
Next.js API Route (/api/chat)
  │
  ├─→ 意图识别 (LLM 分类 + 关键词匹配)
  │     │
  │     ├─→ "帕鲁查询" → 直接查 JSON → 拼入 context
  │     ├─→ "繁殖查询" → 查 breeding.json → 拼入 context
  │     ├─→ "攻略查询" → RAG 检索 → Top-K 拼入 context
  │     └─→ "综合问题" → 全量检索 + RAG
  │
  ├─→ 构建 System Prompt + User Prompt
  │
  └─→ LLM API (DeepSeek / OpenAI)
        │
        └─→ Stream 响应 → Server-Sent Events → 前端打字机
```

### 4.2 API 接口

```typescript
POST /api/chat

Request:
{
  messages: Array<{ role: 'user' | 'assistant', content: string }>,
  conversationId?: string
}

Response: (SSE Stream)
event: token
data: {"type": "text", "content": "Jetragon 是..."}

event: token
data: {"type": "pal_ref", "content": {"id": 1, "name": "Jetragon"}}

event: token
data: {"type": "suggestion", "content": {"actions": [...]}}

event: done
data: {"conversationId": "xxx", "tokensUsed": 123}

---

POST /api/chat/rag-search  // 仅供调试/内部使用

Request:
{
  query: string,
  topK: number
}

Response:
{
  results: Array<{ title: string, content: string, score: number }>
}
```

### 4.3 成本控制策略

| 策略 | 说明 | 预估节省 |
|------|------|---------|
| 常见问题缓存 | 命中率 40% 的热门问题直接返回缓存 | 40% |
| 意图预分类 | 简单查询走本地 JSON 检索，不调 LLM | 30% |
| 流式响应 | 首 token 延迟 < 200ms，用户体验不受影响 | — |
| Token 限制 | 单次回答上限 1024 tokens | 可控 |
| 速率限制 | 每 IP 10次/分钟，登录用户 60次/分钟 | 防滥用 |
| 低成本模型 | 简单查询用 DeepSeek，复杂问题用 GPT-4o | 50%+ |

## 5. 验收标准

| ID | 标准 | 测试方式 |
|----|------|---------|
| AC-001 | 10 个常见帕鲁查询问题准确率 100% | 自动化测试套件 |
| AC-002 | 繁殖组合查询 100% 匹配 breeding.json | JSON 逐条对比 |
| AC-003 | 首 token 返回 < 500ms (P95) | 性能测试 |
| AC-004 | 流式响应，用户可见打字机效果 | 手动测试 |
| AC-005 | AI 回答中的帕鲁名可点击跳转 | E2E |
| AC-006 | 对话历史刷新后不丢失 | E2E |
| AC-007 | 超出速率限制时返回 429 + 友好提示 | E2E |
| AC-008 | 未登录用户可以看到免费额度剩余 | 单元测试 |

## 6. 风险与缓解

| 风险 | 缓解 |
|------|------|
| LLM 幻觉（编造数据） | RAG 优先，限制自由生成，引用标注 |
| API 费用不可控 | 成本控制策略 + 每月预算告警 |
| 意图识别错误 | 兜底方案：直接返回原始数据 + 推荐相关问题 |
| 响应速度慢 | 流式 + 首 token 优化 + 本地缓存常见问题 |
| 用户恶意攻击（Prompt Injection） | 输入过滤 + 系统提示词加固 + 速率限制 |

## 7. 依赖

- LLM API（DeepSeek / OpenAI）
- Server-Sent Events（SSE）库
- Embedding API（用于 RAG 向量化）
- Zustand（对话状态管理）
- react-markdown + remark-gfm（渲染 LLM 回复）
- nanoid（消息 ID 生成）
