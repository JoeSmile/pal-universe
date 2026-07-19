# 技术方案评估与决策

> Status: Draft · Author: AI Agent · Updated: 2026-07-19  
> 评估范围: 后端复用、数据资产、Docker 基础设施

---

## 目录

1. [后端评估: FastAPI + LangGraph Agent](#1-后端评估)
2. [数据资产: palworld-kb](#2-数据资产-palworld-kb)
3. [数据资产: palworld-atlas-data](#3-数据资产-palworld-atlas-data)
4. [Docker 基础设施](#4-docker-基础设施)
5. [整合架构方案](#5-整合架构方案)
6. [实施路线图](#6-实施路线图)

---

## 1. 后端评估

### 1.1 项目概览

位置: `/Users/guowei/Desktop/github/pal-universe/backend/`

这是一个 **production-ready 的 FastAPI + LangGraph Agent 模板**，由 Atlas Cloud 提供。包含完整的 AI 聊天后端基础设施。

### 1.2 已具备的能力

```
后端能力矩阵                            状态    说明
┌────────────────────────────────────┬──────┬──────────────────┐
│ FastAPI 异步 Web 框架              │ ✅   │ uvicorn + async  │
│ LangGraph Agent (StateGraph)       │ ✅   │ 图状态机 + 工具调用 │
│ 流式 SSE 聊天                     │ ✅   │ POST /chat/stream │
│ 对话历史管理                       │ ✅   │ GET/DELETE /messages │
│ JWT 认证 + 用户会话               │ ✅   │ 完整 auth 流程    │
│ Rate Limiting                      │ ✅   │ slowapi 多层级   │
│ mem0 长期记忆                     │ ✅   │ pgvector 存储    │
│ 多模型容错 (Circular Fallback)    │ ✅   │ retry → 切换模型  │
│ Langfuse 追踪                     │ ✅   │ LLM 调用全链路   │
│ Prometheus + Grafana 监控         │ ✅   │ 预置 Dashboard   │
│ DuckDuckGo 搜索工具               │ ✅   │ 可复用搜索模式   │
│ Alembic 数据库迁移                │ ✅   │ 版本化管理 schema │
│ Docker Compose 编排               │ ✅   │ 全栈一键启动      │
│ PKL 配置                          │ ✅   │ 环境感知配置      │
│ structlog 结构化日志               │ ✅   │ 带上下文日志      │
└────────────────────────────────────┴──────┴──────────────────┘
```

### 1.3 已有 API 接口

| 端点 | 方法 | 功能 | 认证 |
|------|------|------|------|
| `/api/v1/chat` | POST | 非流式聊天 | JWT |
| `/api/v1/chat/stream` | POST | 流式聊天 (SSE) | JWT |
| `/api/v1/messages` | GET | 获取对话历史 | JWT |
| `/api/v1/messages` | DELETE | 清空对话历史 | JWT |
| `/api/v1/auth/register` | POST | 用户注册 | 无 |
| `/api/v1/auth/login` | POST | 用户登录 | 无 |
| `/api/v1/auth/logout` | POST | 登出 | JWT |
| `/api/v1/auth/session` | GET | 当前会话 | JWT |
| `/health` | GET | 健康检查 | 无 |

### 1.4 LangGraph Agent 架构

```
LangGraphAgent
│
├── Node: chat (入口)
│   ├── 加载 System Prompt (含 mem0 长期记忆)
│   ├── 调用 LLM (含 retry + circular fallback)
│   └── 判断: 有 tool_call → 转 tool_call, 否则 END
│
├── Node: tool_call
│   ├── 并发执行工具调用
│   └── 返回结果到 chat
│
├── Checkpointer: AsyncPostgresSaver
│   └── 持久化对话状态到 PostgreSQL
│
└── Memory: mem0 (AsyncMemory)
    ├── 语义搜索 (search by user_id + query)
    └── 自动存储 (add after each response)
```

### 1.5 Docker 编排

```yaml
docker-compose.yml (已有)
├── db            pgvector/pgvector:pg16    ← 核心数据库
├── valkey        valkey/valkey:8.1.6       ← 缓存 (可选)
├── app           Python FastAPI             ← API 服务
├── prometheus    prom/prometheus:latest    ← 监控
├── grafana       grafana/grafana:latest    ← 可视化
└── cadvisor      gcr.io/cadvisor:latest    ← 容器监控
```

### 1.6 需要添加的内容

| 文件 | 改动类型 | 行数 | 说明 |
|------|---------|------|------|
| `app/core/langgraph/tools/palworld_search.py` | 新建 | ~100 | 帕鲁数据查询工具 |
| `app/core/langgraph/tools/breeding_calc.py` | 新建 | ~150 | 繁殖计算工具 |
| `app/core/langgraph/tools/__init__.py` | 修改 | +2 | 注册新工具 |
| `app/core/prompts/system.md` | 替换 | ~50 | Palworld 专家提示词 |
| `scripts/seed_palworld_data.py` | 新建 | ~200 | 数据清洗入库 |
| `scripts/pal_tools.py` | 新建 | ~100 | 本地数据查询 CLI |

### 1.7 复用评估结论

| 评估维度 | 分数 | 说明 |
|---------|------|------|
| 代码复用率 | 90% | 仅需新增 ~300 行工具代码 |
| 功能匹配度 | 95% | LLM 调用/流式/认证/限流全部已有 |
| 学习成本 | 低 | 按 AGENTS.md 规范添加工具即可 |
| 迁移成本 | 无 | 就是当前项目的一部分 |

**结论：直接复用，不改现有架构，仅扩展工具层和系统提示词。**

---

## 2. 数据资产: palworld-kb

### 2.1 项目概览

位置: `/Users/guowei/Desktop/github/palworld-kb/`
类型: Palworld 1.0 知识库 (俄语项目，数据为英文)
数据版本: 1.0 (2026-07-10 发布)
在线地址: https://beliarance.github.io/palworld-kb/web/

### 2.2 完整数据清单

```
data/
├── 核心数据
│   ├── pals_combat.json       ← 299 只帕鲁 (含战斗属性、工作适性、掉落物)
│   ├── breeding.json           ← 繁殖组合表
│   ├── type_chart.json         ← 9 元素克制关系表
│   ├── items.json              ← 1195 个物品数据
│   ├── active_skills.json      ← 328 个主动技能
│   ├── passives.json           ← 114 个被动技能
│   │
├── 额外数据
│   ├── bosses.json             ← Boss 信息 (Alpha/塔主/袭击)
│   ├── pal_locations.json      ← 帕鲁分布位置 (含坐标)
│   ├── resource_nodes.json     ← 资源点位置
│   ├── regions.json            ← 区域划分
│   ├── expeditions.json        ← 远征任务数据
│   ├── tier_lists.json         ← T排行
│   ├── skill_dps_meta.json     ← 技能 DPS 分析
│   │
├── 元数据
│   ├── icons.json              ← 图标 URL 映射
│   ├── index.json              ← 数据索引
│   │
└── raw/ (原始抓取数据缓存)
    ├── item_meta.json
    ├── paldb_work_speed_tables.json
    ├── paldb_base_building_raw.json
    ├── paldb_active_skills.html
    ├── paldb_breeding.html
    ├── paldb_locations_parsed.json
    ├── palpedia_breeding.html
    ├── paldex_region_tallies.json
    ├── paldb_codename_map.json
    ├── expeditions_palpedia_raw.json
    └── _raw_batch1..3.json
```

### 2.3 pals_combat.json 结构示例

```json
{
  "name": "Anubis",
  "internal_name": "Anubis",
  "types": ["ground"],
  "deck_id": 1,
  "drops": ["pure_quartz", "bone", "ruby", "anubis_statue"],
  "combat_stats": {
    "hp": 130, "attack": 100, "defense": 80,
    "sanity": 100, "food": 5, "stamina": 300,
    "speed_run": 750, "speed_ride": 950,
    "speed_ride_type": "sprinting",
    "slow_walk_speed": 80, "slow_run_speed": 400
  },
  "work_orders": [
    {"skill": "handiwork", "level": 2},
    {"skill": "transporting", "level": 2},
    {"skill": "mining", "level": 3}
  ],
  "skills": [...],
  "breeding_rank": 570,
  "breeding_combi_rank_parent": false,
  "male_probability": 0.5,
  "is_boss": false,
  "size": "M",
  "price": 5120,
  "locations": [{"region": "3", "area": "twilight_dunes"}]
}
```

### 2.4 数据质量评估

| 评估维度 | 评分 | 说明 |
|---------|------|------|
| 数据完整性 | ⭐⭐⭐⭐⭐ | 299 帕鲁 + 328 技能 + 114 被动 + 1195 物品 |
| 数据结构化 | ⭐⭐⭐⭐⭐ | 标准 JSON，字段清晰，类型完备 |
| 数据新鲜度 | ⭐⭐⭐⭐⭐ | 1.0 版本发布 4 天后的数据 |
| 数据一致性 | ⭐⭐⭐⭐ | 多数据源交叉验证，有冲突标记 |
| 中文支持 | ⭐ | 英文 + 俄语，需要翻译中文名 |
| 图片资源 | ⭐⭐⭐ | 有图标 URL 但无本地图片 |

### 2.5 数据清洗入库方案

```
palworld-kb/data/*.json
    │
    ▼
scripts/seed_palworld_data.py
    │
    ├── 1. 加载所有 JSON 文件
    │
    ├── 2. 数据清洗
    │   ├── 字段映射 (俄语/英文 → 统一命名)
    │   ├── 补全中文名 (LLM 批量翻译)
    │   ├── 合并数据源 (多个 breeding 来源去重)
    │   └── 添加版本标记
    │
    ├── 3. 构建 Embedding
    │   ├── 帕鲁描述 → text-embedding-3-small (1536d)
    │   ├── 物品描述 → text-embedding-3-small (1536d)
    │   └── 存储到 pgvector
    │
    ├── 4. 写入 PostgreSQL
    │   ├── pals 表: 基础信息 + embedding
    │   ├── breeding 表: 繁殖组合索引
    │   ├── items 表: 物品数据 + embedding
    │   ├── skills 表: 技能数据
    │   └── locations 表: 位置数据
    │
    └── 5. 构建搜索索引
        ├── PostgreSQL FTS (全文搜索)
        └── 内存缓存 (热门查询)
```

### 2.6 数据库 Schema 设计

```sql
-- 帕鲁主表
CREATE TABLE pals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,         -- 英文名
    name_cn VARCHAR(100),               -- 中文名
    types VARCHAR(50)[],                -- 元素类型数组
    internal_name VARCHAR(100),
    deck_id INTEGER,
    rarity INTEGER,
    price INTEGER,
    size VARCHAR(10),
    drops TEXT[],
    description TEXT,
    
    -- JSON 字段 (保留原始结构)
    combat_stats JSONB,
    work_orders JSONB,
    skills JSONB,
    
    -- 向量
    embedding vector(1536),
    
    -- 元数据
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    data_version VARCHAR(20)
);

CREATE INDEX idx_pals_name ON pals USING gin (name gin_trgm_ops);
CREATE INDEX idx_pals_types ON pals USING gin (types);
CREATE INDEX idx_pals_embedding ON pals USING ivfflat (embedding vector_cosine_ops);

-- 繁殖组合表
CREATE TABLE breeding (
    id SERIAL PRIMARY KEY,
    parent1 VARCHAR(100) NOT NULL,
    parent2 VARCHAR(100) NOT NULL,
    child VARCHAR(100) NOT NULL,
    is_special BOOLEAN DEFAULT FALSE,    -- 特殊组合标记
    UNIQUE(parent1, parent2)
);

CREATE INDEX idx_breeding_parents ON breeding (parent1, parent2);
CREATE INDEX idx_breeding_child ON breeding (child);

-- 物品表
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50),
    category VARCHAR(50),
    rarity INTEGER,
    description TEXT,
    recipe JSONB,                        -- 配方
    embedding vector(1536),
    data_version VARCHAR(20)
);

-- 技能表
CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(50),
    element VARCHAR(20),
    power INTEGER,
    cooldown DECIMAL,
    description TEXT,
    category VARCHAR(50)                -- active / passive
);
```

---

## 3. 数据资产: palworld-atlas-data

### 3.1 项目概览

位置: `/Users/guowei/Desktop/github/palworld-atlas-data/`
类型: C# 项目，从游戏文件中提取的原始数据
数据格式: JSON (每只帕鲁独立文件)
构建版本: 24181105 (最新)

### 3.2 数据结构

```
published/v1/
├── latest.json              ← 指向最新构建
│
└── builds/24181105/
    ├── maps/
    │   ├── tree/
    │   │   └── spawns.json     ← 世界树地图刷怪点
    │   └── palpagos/
    │       └── spawns.json     ← 帕尔帕戈斯地图刷怪点
    │
    └── pals/
        ├── FairyDragon_Water.json
        ├── CubeTurtle.json
        ├── Anubis.json
        ├── ...                 ← 每只帕鲁独立 JSON
        └── (全量文件)
```

### 3.3 spawns.json 结构

```json
{
  "palpagos": {
    "regions": [...],
    "spawn_points": [
      {
        "pal_name": "Anubis",
        "coordinates": {"x": -234, "y": 456},
        "level_range": {"min": 30, "max": 35},
        "time": "day",
        "frequency": "common",
        "is_alpha": false
      }
    ]
  }
}
```

### 3.4 使用方式

| 数据用途 | 来源 | 处理方式 |
|---------|------|---------|
| 帕鲁基础属性 | palworld-kb (更全) | 主数据源 |
| 帕鲁位置/刷怪点 | palworld-atlas-data | 地图图层渲染 |
| 游戏版本对比 | palworld-atlas-data builds | 版本变更检测 |
| 验证交叉校验 | 两者交叉对比 | 数据一致性检查 |

---

## 4. Docker 基础设施

### 4.1 本地已有镜像

```bash
$ docker images

REPOSITORY                           TAG               SIZE
pgvector/pgvector                    pg16              438MB    ← 核心：PostgreSQL + 向量扩展
postgres                             16-alpine         276MB    ← PostgreSQL 精简版
postgres                             17-alpine         279MB    ← 新版 PostgreSQL
redis                                7-alpine          39.1MB   ← Redis 缓存
node                                 20-alpine         136MB    ← Node.js 构建环境
python                               3.12-slim         119MB    ← Python 运行时
ghcr.io/astral-sh/uv                 python3.12-bookworm-slim  177MB    ← Python 包管理器
nginx                                1.27-alpine       48.2MB   ← 反向代理
prom/prometheus                      v2.55.1           290MB    ← 监控指标
grafana/grafana                      11.3.0            485MB    ← 监控面板
redis/redis-stack                    7.4.0-v1          782MB    ← Redis 全栈版 (含搜索模块)
```

### 4.2 镜像用途矩阵

| 镜像 | 用途 | 必需? | 备注 |
|------|------|-------|------|
| `pgvector/pgvector:pg16` | 核心数据库 + 向量存储 | **是** | 主数据库 |
| `valkey/valkey:8.1.6-alpine` | API 缓存层 | 可选 | 已有 compose 配置 |
| `prom/prometheus:latest` | 性能指标采集 | 可选 | 已有 compose |
| `grafana/grafana:latest` | 指标可视化 | 可选 | 已有 compose |
| `redis/redis-stack:7.4.0-v1` | 可替代 valkey | 可选 | 如果要用 RediSearch |

### 4.3 启动方案

```bash
# 最小化启动 (仅数据库 + API)
cd /Users/guowei/Desktop/github/pal-universe/backend
docker compose up db app -d

# 完整启动 (含监控栈)
make stack-up ENV=development

# 仅启动数据库 (开发前端时)
docker compose up db -d
```

---

## 5. 整合架构方案

### 5.1 系统架构图

```
                              用户
                               │
                          ┌────▼────┐
                          │ 浏览器   │
                          │ Next.js  │
                          └────┬────┘
                               │ HTTPS
                    ┌──────────┼──────────┐
                    │          │          │
              ┌─────▼────┐ ┌──▼───┐ ┌───▼────┐
              │ 静态页面  │ │API   │ │ AI Chat│
              │ /pals/*  │ │/api/*│ │ /chat  │
              │ /breeding│ └──┬───┘ └───┬────┘
              └──────────┘    │          │
                              │    ┌─────▼──────────────┐
                              │    │ pal-universe/backend │
                              │    │ FastAPI + LangGraph │
                              │    │                     │
                              │    │ Tools:              │
                              │    │ ├─ pal_search       │
                              │    │ ├─ breeding_calc    │
                              │    │ ├─ map_search       │
                              │    │ └─ web_search       │
                              │    │                     │
                              │    │ Memory: mem0        │
                              │    └─────────┬───────────┘
                              │              │
                         ┌────▼────┐   ┌─────▼─────┐
                         │ Vercel  │   │ PostgreSQL  │
                         │ CDN     │   │ + pgvector  │
                         └─────────┘   └────────────┘
```

### 5.2 数据流

```
数据源                                  →  数据库           →  API           →  前端
─────────────────────────────────────────────────────────────────────────────────────
palworld-kb (299帕鲁 + 繁殖 + 物品)     →  pgvector         →  pal_search    →  帕鲁卡片
palworld-atlas-data (位置/刷怪点)       →  JSON 静态文件    →  map_search    →  互动地图
[LLM 翻译中文名]                        →  pals.name_cn    →  搜索索引      →  中文搜索
[知识库 Markdown]                       →  mem0 + pgvector  →  RAG 检索      →  AI Chat
```

### 5.3 技术栈整合

```
前端 (复用 ai_agent/frontend 配置)
├── Next.js 15 (App Router)
├── React 19 + TypeScript
├── Tailwind CSS v4 + Radix UI
├── Zustand + TanStack React Query
├── Framer Motion (动画)
├── Leaflet (地图)
└── react-markdown (LLM 渲染)

后端 (直接复用 pal-universe/backend)
├── FastAPI + Uvicorn
├── LangGraph (Agent 工作流)
├── LangChain (LLM 抽象)
├── PostgreSQL 16 + pgvector
├── mem0 (长期记忆)
├── Langfuse (追踪)
├── Prometheus + Grafana (监控)
├── Valkey/Redis (缓存)
└── SlowAPI (限流)

CI/CD
├── GitHub Actions (质量门禁)
├── Vercel (前端部署)
├── Docker Compose (后端部署)
└── Dependabot (依赖扫描)
```

---

## 6. 实施路线图

### Phase 1: 基础设施 + 核心功能 (预估 1-2 天)

```
Step 1: 数据清洗入库 (4h)
├── scripts/seed_palworld_data.py
├── 清洗 palworld-kb JSON → pgvector
├── 补全中文名
└── 验证数据完整性

Step 2: 后端工具扩展 (2h)
├── palworld_search.py (帕鲁查询工具)
├── breeding_calc.py (繁殖计算工具)
├── system.md (Palworld 提示词)
└── 测试工具调用 (CLI)

Step 3: 前端初始化 (3h)
├── 从 ai_agent/frontend 复制配置
├── 初始化项目 + tailwind + 基础组件
├── 首页布局
└── API 客户端封装

Step 4: CI/CD (1h)
├── GitHub Actions workflow
└── Vercel 部署配置
```

### Phase 2: 发布

```
Step 5: 帕鲁卡牌系统
├── PalCard + PalCardGrid 组件
├── 筛选/搜索
└── 对比模式

Step 6: AI Chat 前端
├── 聊天 UI 组件
├── SSE 流式连接
└── 对话历史

Step 7: 繁殖计算器
├── 双向查询
├── 多代推演
└── 树图可视化
```

### 文件清单

```
pal-universe/
├── backend/                           # ✅ 已有 (复用)
│   └── app/core/langgraph/tools/
│       ├── palworld_search.py         # 📝 新增
│       ├── breeding_calc.py           # 📝 新增
│       └── __init__.py               # 📝 修改 (+2行)
│
├── frontend/                          # 📝 新建 (复用配置)
│   ├── package.json                   # 复制 ai_agent/frontend
│   ├── tsconfig.json                  # 复制
│   ├── Dockerfile                     # 复制
│   └── src/
│
├── scripts/
│   ├── seed_palworld_data.py          # 📝 新增
│   └── validate_data.py              # 📝 新增
│
├── data/                              # 📝 软链接
│   └── palworld-kb → ../palworld-kb/data
│
└── docs/                              # ✅ 已有
```

---

## 附录

### A. 数据源对比

| 维度 | palworld-kb | palworld-atlas-data | mlg404/paldex-api |
|------|------------|-------------------|-------------------|
| 帕鲁数量 | 299 | ~200+ | ~200+ |
| 繁殖组合 | ✅ 完整 | ❌ | ✅ 完整 |
| 物品数据 | ✅ 1195件 | ❌ | ❌ |
| 技能数据 | ✅ 328主动+114被动 | ❌ | ✅ 基础 |
| 位置数据 | ✅ 含坐标 | ✅ 精确刷怪点 | ❌ |
| 图片资源 | ❌ 仅有URL | ❌ | ✅ 有图片 |
| 数据格式 | JSON | JSON (每帕鲁单文件) | JSON |
| 中文 | ❌ (俄/英) | ❌ | ❌ |
| 许可证 | 未标注 | MIT | MIT |

### B. 依赖版本

| 组件 | 版本 | 来源 |
|------|------|------|
| Python | >= 3.13 | pyproject.toml |
| FastAPI | >= 0.121.0 | 已有 |
| LangGraph | >= 1.0.2 | 已有 |
| PostgreSQL | 16 | docker-compose |
| pgvector | pg16 版本 | docker-compose |
| Node.js | 20+ | Dockerfile |
| Next.js | 15.1.0 | 复用 |
| React | 19.0.0 | 复用 |
