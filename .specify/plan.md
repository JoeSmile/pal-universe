# Pal Universe 技术方案

> 来源: docs/decisions/ADR-001-TECH-STACK.md + docs/architecture/ARCHITECTURE.html  
> 本文件是 spec-kit 的 plan.md，只放"不会每周变"的架构决策。

---

## 1. 系统架构（6 层）

```
接入层     PC Web / Mobile Web
API 网关   Nginx → FastAPI → Schema校验 → 审计日志 → 成本追踪 → Rate Limit → 熔断
Agent 层   LangGraph → 工具链(6) → RAG(pgvector) → LLM(DeepSeek)
缓存层     Redis Stack(语义缓存) + 本地 LRU
数据层     pgvector(主数据) + 图片(CDN) + 审计日志(JSONL轮转)
基础设施   Docker Compose + GitHub Actions + 腾讯云 4G
```

**不变原则：**
- 前端 Vercel / 后端 Docker — 不混合部署
- AI Chat 用 conversation_id 增量协议 — 不传全量历史
- 数据库只用 pgvector — 不额外引入 Pinecone/Chroma

## 2. 技术栈

| 层 | 技术 | 选型理由 |
|----|------|---------|
| 前端框架 | Next.js 15 (App Router) | SSG/SSR/Streaming 三合一 |
| 样式 | Tailwind v4 + Radix UI | 设计 Token 驱动 |
| 动画 | Framer Motion | React 生态最强 |
| 后端 | FastAPI + Uvicorn | Python 异步天花板 |
| AI 编排 | LangGraph StateGraph | 多步推理 + 状态持久化 |
| 数据库 | PostgreSQL 16 + pgvector | 向量+关系一体 |
| 缓存 | Redis Stack (RediSearch) | 语义缓存需要向量索引 |
| LLM | DeepSeek | 国产，国内直连，成本低 |

## 3. 数据库 Schema（真实结构）

```sql
CREATE TABLE pals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    elements JSONB,
    deck_id VARCHAR(10),
    rarity INTEGER,
    size VARCHAR(10),
    drops JSONB,
    work_orders JSONB,
    skills JSONB,
    data JSONB  -- 完整帕鲁数据（含 breeding_rank, stats 等）
);

CREATE TABLE breeding (
    id SERIAL PRIMARY KEY,
    parent1 VARCHAR(100) NOT NULL,
    parent2 VARCHAR(100) NOT NULL,
    child VARCHAR(100) NOT NULL,
    is_special BOOLEAN DEFAULT FALSE
);
```

## 4. 不变的安全策略

- CSP 严格策略（见 PRD-007 配置）
- 无用户系统（不做 JWT auth）
- Rate Limiting: /pals 60/min, /breeding 30/min, /chat 5/min（slowapi）
- 成本熔断: IP 日 5w tokens → 429, 全局日 50w → 降级
- 审计日志: 全量 API 记录，按天 JSONL 轮转

## 5. 部署

```
Stage 1 (现在): 腾讯云 Lighthouse 4GB + Docker Compose
  前端: Nginx 反代 Next.js
  后端: FastAPI 容器
  数据库: pgvector 容器
  缓存: Redis Stack 容器

Stage 2 (未来): 读写分离 + CDN
Stage 3 (遥见): K8s + 微服务
```

成本红线: ¥100-200/月（4G → 8G 服务器）
