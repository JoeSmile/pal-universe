# Pal Universe — Task 队列与分工

> 更新于 2026-07-20
> 分工原则: Hermes 处理后端/脚本/文档, Cursor 做前端组件/页面

---

## 一、当前任务全景

### 已完成 (12)

| Task | 内容 | 谁做的 |
|------|------|--------|
| 001 | 数据入库 pgvector | Hermes |
| 002 | 前端初始化 | Cursor |
| 003 | CI/CD | Hermes |
| 004 | 设计 Token | Hermes |
| 005 | 首页搜索框 | Cursor |
| 006 | 帕鲁卡牌组件 | Cursor |
| 007 | 帕鲁列表页 | Cursor |
| 011 | 首页增强 (quick-links/hot-pals) | Cursor |
| 012 | 后端 API: 帕鲁搜索+详情 | Hermes |
| 013 | 后端 API: 繁殖计算 | Hermes |
| 014 | 后端中间件 (审计/成本/熔断) | Hermes |
| 015 | Chat V2 增量协议 | Hermes |

### 待执行 (5)

| Task | 内容 | 谁做 | 依赖 | 优先级 |
|------|------|------|------|--------|
| **008** | 后端工具注册 (pal_search/6 tools 注册进 LangGraph) | **Hermes** | 012 | **P0** |
| **009** | 繁殖计算器前端 UI | **Cursor** | 013 | P1 |
| **010** | AI Chat 前端 UI (对话气泡/SSE 接收) | **Cursor** | 015 | P1 |
| **016** | 帕鲁详情页 (大图/属性条/技能/工作/掉落/位置/AI) | **Cursor** | 006 | P1 |
| **017** | 队伍搭配页 (替换入口的"属性克制"为"队伍搭配") | **Cursor** | 005 | P1 |

### 未写 Task 但确定要做 (6)

| 内容 | 谁做 | 依赖 | 优先级 |
|------|------|------|--------|
| 切 RedisSaver Checkpointer | **Hermes** | 无 | **P0** |
| Prompt Registry (目录+版本管理) | **Hermes** | 无 | **P0** |
| Eval 测试用例 + Runner | **Hermes** | 无 | P1 |
| Turnstile 防刷 | **Hermes + Cursor** | 无 | P1 |
| Langfuse 全链路 Tracing | **Hermes** | 无 | P1 |
| RAG Node (缓存检查+pgvector检索) | **Hermes** | 008 | P1 |

---

## 二、执行顺序

```
现在 ──→ Hermes 做 008 (工具注册)
 │         并行
 │         Cursor 做 016 (帕鲁详情页)
 │
 ├──→ Hermes 做 RedisSaver + Prompt Registry
 │
 ├──→ Cursor 做 009 (繁殖计算器 UI) + 010 (Chat 前端 UI)
 │
 ├──→ Hermes 做 Eval + Tracing + Turnstile
 │
 └──→ Cursor 做 017 (队伍搭配页)
```

**互不阻塞：** Hermes 处理后端（工具/缓存/安全），Cursor 做前端（页面/组件），同时推进。

---

## 三、分工明细

### Hermes 负责

```
后端基础设施:
  ─ 008-backend-tools: 6 个工具注册进 LangGraph
    pal_search, breeding_calc, breeding_reverse,
    location_query, type_chart, web_search (已有)
  ─ RedisSaver: 替换 AsyncPostgresSaver
  ─ Prompt Registry: 目录结构 + 版本管理
  ─ Eval Runner + 20 条测试用例
  ─ Langfuse Tracing 增强
  ─ RAG Node (Phase 1 末)

数据与脚本:
  ─ process_spawns.py (已完成)
  ─ seed 脚本维护
  ─ 审计日志分析

文档:
  ─ CHAT-FLOW.md (已完成)
  ─ CHAT-DEEP-DIVE.md (已完成)
  ─ AGENT-HOOKS.md (已完成)
  ─ GRAPH-ARCHITECTURE.md (已完成)
```

### Cursor 负责

```
前端页面:
  ─ 009-breeding-calc: 繁殖计算器页面
  ─ 010-ai-chat-frontend: Chat 前端 UI
  ─ 016-pal-detail: 帕鲁详情页
  ─ 017-team-builder: 队伍搭配页

前端组件:
  ─ pal-chooser (帕鲁选择器，复用 SearchBar)
  ─ chat-bubble (对话气泡组件)
  ─ stat-bar (属性进度条)
  ─ team-slot (队伍槽位组件)
```
