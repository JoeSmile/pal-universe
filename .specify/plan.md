# Pal Universe 技术方案

> 来源: docs/decisions/ADR-001-TECH-STACK.md + docs/architecture/DATA-BACKEND-ARCHITECTURE.md  
> 本文件是 spec-kit 的 plan.md，供 AI Agent 理解技术架构。

---

## 1. 系统架构

```
          用户浏览器
              │
         ┌────▼────┐
         │  Vercel  │  ← 前端 CDN + Edge
         │  Next.js │
         └────┬────┘
              │
    ┌─────────┼─────────┐
    │         │         │
    │    ┌────▼────┐    │
    │    │ 后端 API │    │  ← FastAPI + LangGraph
    │    │ :8000    │    │
    │    └────┬────┘    │
    │         │         │
    │    ┌────▼────┐    │
    │    │PostgreSQL│    │  ← pgvector 向量存储
    │    │:5432    │    │
    │    └─────────┘    │
    │                   │
    └───────────────────┘
        Docker Compose (本地/服务器)
```

## 2. 渲染策略

| 页面 | 策略 | 原因 |
|------|------|------|
| 首页 | SSG（静态生成） | 内容固定，build 时生成 |
| 帕鲁列表 | SSG | 数据变更频率低 |
| 帕鲁详情 | SSG + ISR（revalidate: 1周） | 游戏更新后自动再生 |
| 繁殖计算器 | CSR | 交互密集型 |
| AI Chat | SSR + Streaming | 需要服务端 LLM 调用 |
| 地图 | SSR 壳 + CSR 地图数据 | 地图引擎需浏览器 API |

## 3. 数据流程

```
palworld-kb/*.json ──→ scripts/seed_palworld_data.py ──→ pgvector
                    │                                      │
                    │                                      ├─ pals 表 (含 embedding)
                    │                                      ├─ breeding 表
                    │                                      ├─ items 表
                    │                                      └─ skills 表
                    │
palworld-atlas-data ──→ scripts/process_map_data.py ──→ frontend/data/maps.json
                                                         (静态文件，直接引用)
```

### RAG 检索流程（AI Chat）

```
用户问题
  → 意图分类（LLM）
    ├─ 帕鲁查询 → 直接 SQL（pals 表）
    ├─ 繁殖查询 → 直接 SQL（breeding 表）
    ├─ 综合问题 → pgvector 向量检索（pals.embedding）
    └─ 攻略问题 → mem0 语义检索
  → 拼接 context → LLM → 流式响应
```

## 4. 数据库 Schema

### pals 表
```sql
CREATE TABLE pals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_cn VARCHAR(100),
    types VARCHAR(50)[],
    deck_id INTEGER,
    rarity INTEGER,
    size VARCHAR(10),
    drops TEXT[],
    combat_stats JSONB,
    work_orders JSONB,
    skills JSONB,
    embedding vector(1536),
    created_at TIMESTAMP DEFAULT NOW(),
    data_version VARCHAR(20)
);
```

### breeding 表
```sql
CREATE TABLE breeding (
    id SERIAL PRIMARY KEY,
    parent1 VARCHAR(100) NOT NULL,
    parent2 VARCHAR(100) NOT NULL,
    child VARCHAR(100) NOT NULL,
    is_special BOOLEAN DEFAULT FALSE
);
```

## 5. API 契约

### 聊天 API
```
POST /api/v1/chat/stream
Authorization: Bearer <jwt>

Request:
{
  messages: [{ role: "user", content: "..." }],
  conversationId?: string
}

Response: SSE Stream
event: token
data: {"type": "text", "content": "..."}

event: token
data: {"type": "pal_ref", "content": {"id": 1, "name": "Anubis"}}

event: done
data: {"conversationId": "xxx"}
```

## 6. 工具清单

### Hermes 工具（后端扩展）
- `pal_search(query, filters)` — 查询帕鲁数据
- `breeding_calc(p1, p2)` — 繁殖计算结果
- `breeding_reverse(target)` — 查询所有父代组合
- `map_search(pal_name)` — 查询帕鲁位置

### Cursor 工具（前端开发）
- PalCard 组件系列
- 繁殖树可视化组件
- 聊天 UI 组件
- 地图组件

## 7. 部署

```yaml
前端: Vercel (pal-universe.vercel.app)
后端: Docker Compose (自己的服务器或云主机)
  - db: pgvector/pgvector:pg16
  - valkey: valkey/valkey:8.1.6-alpine (可选)
  - app: FastAPI (自动构建)
  - prometheus + grafana (监控，可选)
```

## 8. 安全

- CSP 严格策略（见 PRD-007 的配置）
- JWT 认证（后端已有）
- Rate Limiting（slowapi，后端已有）
- CORS 白名单（仅前端域名）
- 依赖 CVE 扫描（Dependabot）

## 9. 性能目标

| 指标 | 目标 |
|------|------|
| FCP | < 0.5s |
| LCP | < 1.0s |
| Lighthouse | 100/100/100 |
| AI Chat 首 token | < 500ms (P95) |
| 筛选/搜索 | < 500ms |
| 繁殖计算 | < 100ms |
