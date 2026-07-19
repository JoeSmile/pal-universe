# Pal Universe — 技术架构分析

> 配合 `docs/architecture/ARCHITECTURE.html` 阅读。
> 涵盖技术选型、数据流、RAG 策略、部署拓扑、演进路径。

---

## 一、整体架构风格

```
                 ┌───────────┐
                 │ 用户浏览器 │
                 └─────┬─────┘
                       │ HTTPS
          ┌────────────┼────────────┐
          │            │            │
    ┌─────▼────┐ ┌────▼───┐ ┌──────▼─────┐
    │ Nginx    │ │ Vercel │ │ 国内 CDN   │
    │ 反向代理  │ │ Edge   │ │ (图片/静态) │
    └─────┬────┘ └────────┘ └────────────┘
          │
    ┌─────▼──────────────────────┐
    │        Docker Compose       │
    │  ┌────────┐ ┌───────────┐  │
    │  │FastAPI │ │Next.js SSR│  │
    │  │LangGrph│ │(可选)     │  │
    │  └───┬────┘ └───────────┘  │
    │      │                     │
    │ ┌────▼────┐ ┌──────────┐  │
    │ │pgvector │ │ Valkey   │  │
    │ │Postgres│ │ 缓存     │  │
    │ └─────────┘ └──────────┘  │
    └───────────────────────────┘
```

**原则：单机部署，不微服务。** 直到 DAU > 10000 之前，一台 2GB 云服务器够用。

---

## 二、前端数据获取策略（关键决策）

当前有三种数据获取方式，每种适用场景不同：

| 策略 | 方式 | 适用场景 | 延迟 | 上线阶段 |
|------|------|---------|------|---------|
| **JSON Mock** | `import data from './pals.json'` | 前端独立开发 | 0ms | Phase 1 |
| **Server Components** | Next.js 直接查 DB | 列表页、详情页 | ~50ms | Phase 2 |
| **REST API** | `fetch('/api/pals')` | 搜索、繁殖计算 | ~100ms | Phase 2 |

**Phase 1 全部走 JSON Mock**——不依赖后端 API，前端开发不阻塞。等后端工具就绪后，逐步替换为 Server Components。

---

## 三、AI Chat 架构

### 3.1 RAG 流程

```
用户提问
  │
  ▼
意图分类 (前端本地正则匹配)
  │
  ├─ 帕鲁查询 → 直接查本地 JSON → 返回
  ├─ 繁殖查询 → 直接查本地 JSON → 返回
  ├─ 综合问题 → POST /api/v1/chat/stream
  └─ 闲聊 → POST /api/v1/chat/stream

后端 /chat/stream:
  1. 查 pgvector 语义相似 (Top-3 相关帕鲁)
  2. 拼接 context → LLM System Prompt
  3. 调 DeepSeek API → SSE 流式返回
  4. 前端打字机效果
```

### 3.2 为什么用 pgvector 做 RAG

| 方案 | 成本 | 延迟 | 维护 |
|------|------|------|------|
| **pgvector** | $0（Docker 自带） | ~20ms | 零额外服务 |
| Pinecone | $70/月起 | ~50ms | 多一个厂商 |
| ChromaDB | $0（自托管） | ~30ms | 多一个容器 |
| Milvus | $0（自托管） | ~20ms | 重，2GB 服务器跑不动 |

**pgvector 是最优解**——不需要额外数据库，PostgreSQL 原生支持，向量搜索性能足够。

### 3.3 LLM 选型

| 模型 | 成本 | 中文能力 | 国内访问 |
|------|------|---------|---------|
| **DeepSeek V4 Flash** | ~$0.10/M tokens | ⭐⭐⭐⭐⭐ | ✅ 直连 |
| Qwen 3 (通义千问) | ~$0.15/M tokens | ⭐⭐⭐⭐⭐ | ✅ 直连 |
| GPT-4o mini | ~$0.15/M tokens | ⭐⭐⭐⭐ | ❌ 走墙 |
| Claude Haiku 4.5 | ~$0.20/M tokens | ⭐⭐⭐ | ❌ 走墙 |

**选 DeepSeek**——国产、便宜、中文强、直连。

---

## 四、数据流全景

```
                    ┌──────────────┐
                    │ palworld-kb  │  ← 数据源
                    │ JSON 文件    │
                    └──────┬───────┘
                           │ seed_palworld_data.py --db
                           ▼
                    ┌──────────────┐
                    │  pgvector    │  ← 主数据库
                    │  pals(299)   │
                    │  breeding(163)│
                    │  items(1195) │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
       ┌──────────┐ ┌──────────┐ ┌──────────┐
       │ 前端 Mock │ │ 后端工具 │ │ AI RAG  │
       │ JSON     │ │ 直接 SQL │ │ 向量检索 │
       └──────────┘ └──────────┘ └──────────┘
              │            │
              ▼            ▼
       ┌──────────────────────────┐
       │   generate_mock_data.py  │  ← 从 pgvector 导出 JSON
       └──────────────────────────┘
```

**数据只有一份真相（pgvector）。** Mock JSON 是从数据库导出的缓存，不手工修改。

---

## 五、部署拓扑

```
国内部署（Phase 1 目标）:
┌──────────────────────────────────────────┐
│  腾讯云 Lighthouse / 阿里云 ECS           │
│  2 vCPU / 2GB RAM / 60GB SSD / ¥40-80/月 │
│                                          │
│  Nginx (80/443)                          │
│    ├── / → Next.js (SSR, port 3000)      │
│    ├── /api → FastAPI (port 8000)         │
│    └── /chat → SSE 流式代理               │
│                                          │
│  Docker:                                 │
│    ├── nginx:1.27-alpine     (64MB)      │
│    ├── frontend:next.js      (256MB)     │
│    ├── backend:fastapi       (512MB)     │
│    └── db:pgvector/pg16      (512MB)     │
│                                          │
│  外挂:  LLM → DeepSeek API (直连)        │
│        监控 → Uptime Kuma (5min周期)      │
│        备份 → pg_dump → 对象存储          │
└──────────────────────────────────────────┘
```

### 为什么不在 Vercel 上跑后端？

Vercel Serverless Functions 不支持：
- ❌ WebSocket 长连接（AI Chat 用 SSE，但边缘函数有 10s 超时限制）
- ❌ pgvector 数据库连接池（每个请求都新建连接）
- ❌ LangGraph 状态持久化（Checkpointer 需要长连接 PostgreSQL）

Vercel 只跑前端，后端老老实实放 Docker 里。

---

## 六、演进路径

```
Phase 1 (现在)
  ├── 前端 JSON Mock 开发
  ├── pgvector + DeepSeek API
  ├── 单台国内云服务器
  └── Nginx + Docker Compose

Phase 2 (DAU < 1000)
  ├── 前端切换为 Server Components 直查 DB
  ├── 后端加缓存层 (Valkey)
  ├── CDN 分离静态资源
  └── 数据库自动备份

Phase 3 (DAU 1000-10000)
  ├── 读写分离 (pgvector 只读副本)
  ├── 前端静态资源独立部署 (OSS + CDN)
  ├── 后端水平扩展 (多容器 + Nginx 负载均衡)
  └── 考虑迁到 K8s

Phase 4 (DAU > 10000)
  └── 恭喜，你不需要我的建议了 🎉
```

---

## 七、关键技术决策总结

| 决策 | 选择 | 理由 |
|------|------|------|
| 前端框架 | Next.js 15 | SSR/SSG/ISR 灵活，SEO 好 |
| 后端框架 | FastAPI | 已有，异步原生，Python ML 生态 |
| AI 编排 | LangGraph | 已有，StateGraph 适合复杂流程 |
| 向量数据库 | pgvector | 无需额外服务，PostgreSQL 自带 |
| LLM | DeepSeek | 国产、便宜、中文强、直连 |
| 部署 | 单机 Docker | 简单、够用、低成本 |
| 协作 | spec-kit + .specify/ | 多 Agent 文件级通信 |
| 成本控制 | 三层分级 | 本地→缓存→LLM，预估节省 70% |
