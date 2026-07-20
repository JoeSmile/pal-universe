# RAG 知识库层 — 实施计划

> **目标**：补齐 RAG 层缺失的功能，让 Chat AI 能基于 FAQ + 上传文档 + URL 爬取内容做高质量回答

---

## 当前架构（pal-universe）

**已有组件**：
| 组件 | 说明 |
|------|------|
| LangGraph Agent | `LangGraphAgent`（graph.py），PostgreSQL checkpoint，无 RAG |
| Palworld 数据 | JSON 文件（palworld-kb），工具函数直接加载 |
| LLM Service | `LLMService`（多模型回退）+ `LLMRegistry` |
| Cache | `cache_service`（Valkey/Redis 或 in-memory） |
| Memory | `mem0ai` + pgvector（仅用户长期记忆，非 RAG） |
| 前端 | Next.js 14 App Router + Tailwind + shadcn/ui |
| 已有工具 | `pal_search` / `breeding_calc` / `breeding_reverse` / `map_search` / `duckduckgo_search` / `ask_human` |

**缺失的**：
- ❌ 无 pgvector RAG 文档存储
- ❌ 无 embedding 服务（mem0 自己处理 embedding，不对外暴露）
- ❌ 无文件上传 / 解析 / chunk 管线
- ❌ 无 URL 爬取能力
- ❌ 无 FAQ 缓存
- ❌ 无 RAG 搜索工具注册给 Agent

---

## 设计决策

1. **重用现有 PostgreSQL** — pgvector 扩展。用 `rag_documents` 和 `rag_chunks` 两张 SQLModel 表存，不用每个 collection 一张表（更简洁）
2. **重用现有 `cache_service`** — FAQ 缓存直接走 Valkey/Redis，不上 Redis Stack
3. **embedding 复用 LLM 配置** — 跟 `OPENAI_API_KEY` / `OPENAI_BASE_URL` 一致
4. **新工具注册到 `tools/__init__.py`** — 按项目现有风格

---

## Task 1: Embedding 服务 + pgvector 基础

**目标**：搭建 RAG 底座 — embedding 生成 + pgvector CRUD

### 1.1 配置项

**Modify**: `backend/app/core/config.py`

```python
# 在 Settings.__init__ 里加
self.RAG_ENABLED = os.getenv("RAG_ENABLED", "false").lower() in ("true", "1")
self.RAG_TABLE_NAME = os.getenv("RAG_TABLE_NAME", "rag_chunks")
self.EMBEDDING_DIM = int(os.getenv("EMBEDDING_DIM", "1536"))  # text-embedding-3-small
```

### 1.2 Embedding 服务

**Create**: `backend/app/services/rag/embeddings.py`

```python
"""Embedding provider for RAG."""
from openai import OpenAI
from app.core.config import settings

class EmbeddingService:
    def __init__(self):
        client_kwargs = {"api_key": settings.OPENAI_API_KEY}
        base_url = os.getenv("OPENAI_BASE_URL", "")
        if base_url:
            client_kwargs["base_url"] = base_url
        self.client = OpenAI(**client_kwargs)
        self.model = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")

    def embed_query(self, text: str) -> list[float]:
        resp = self.client.embeddings.create(model=self.model, input=text)
        return resp.data[0].embedding

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        resp = self.client.embeddings.create(model=self.model, input=texts)
        return [d.embedding for d in resp.data]
```

### 1.3 pgvector 模型 + 迁移

**Create**: `backend/app/models/rag.py`

```python
"""RAG document and chunk models."""
from sqlmodel import SQLModel, Field, Column, JSON
from pgvector.sqlmodel import Vector  # pip install pgvector

class RAGDocument(SQLModel, table=True):
    __tablename__ = "rag_documents"
    id: str = Field(primary_key=True)
    filename: str
    source_url: str | None = None
    chunk_count: int = 0
    created_at: str = ""

class RAGChunk(SQLModel, table=True):
    __tablename__ = "rag_chunks"
    id: str = Field(primary_key=True)
    document_id: str = Field(foreign_key="rag_documents.id")
    content: str
    embedding: Vector = Field(sa_type=Vector(settings.EMBEDDING_DIM))
    metadata: dict = Field(default={}, sa_column=Column(JSON))
```

需加依赖：
- `pgvector` 到 `backend/pyproject.toml`
- 在 `db/init.sql` 加 `CREATE EXTENSION IF NOT EXISTS vector;`

### 1.4 pgvector 存储服务

**Create**: `backend/app/services/rag/vectorstore.py`

```python
"""pgvector-based vector store for RAG documents."""
import uuid
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy import text
from app.models.rag import RAGChunk, RAGDocument
from app.services.database import database_service

class PgVectorStore:
    def __init__(self, embed_service):
        self.embedder = embed_service

    async def insert_document(self, filename: str, chunks: list[str], metadata: dict | None = None) -> str:
        doc_id = uuid.uuid4().hex
        session = AsyncSession(database_service.engine)
        session.add(RAGDocument(id=doc_id, filename=filename, chunk_count=len(chunks)))
        embeddings = self.embedder.embed_documents(chunks)
        for i, (content, emb) in enumerate(zip(chunks, embeddings)):
            session.add(RAGChunk(
                id=f"{doc_id}:{i}", document_id=doc_id,
                content=content, embedding=emb, metadata=metadata or {},
            ))
        await session.commit()
        await session.close()
        return doc_id

    async def search(self, query: str, top_k: int = 5, min_score: float = 0.7) -> list[dict]:
        q_vec = self.embedder.embed_query(query)
        session = AsyncSession(database_service.engine)
        sql = text("""
            SELECT content, 1 - (embedding <=> :query_vec) AS score, document_id, metadata
            FROM rag_chunks
            WHERE 1 - (embedding <=> :query_vec) > :min_score
            ORDER BY embedding <=> :query_vec
            LIMIT :top_k
        """)
        rows = await session.execute(sql, {"query_vec": str(q_vec), "min_score": min_score, "top_k": top_k})
        await session.close()
        return [{"content": r[0], "score": float(r[1]), "document_id": r[2], "metadata": r[3]} for r in rows]
```

### 1.5 初始化

**Modify**: `backend/app/main.py` lifespan

在 startup 里初始化 embedding + vector store：

```python
from app.services.rag.embeddings import EmbeddingService
from app.services.rag.vectorstore import PgVectorStore

embed_service = EmbeddingService()
state["embed_service"] = embed_service
state["vector_store"] = PgVectorStore(embed_service)
```

---

## Task 2: 文件上传 + 文档解析

**目标**：支持上传 PDF / TXT / MD，解析 → chunk → embed → 存库

### 2.1 文档解析器

**Create**: `backend/app/services/rag/parser.py`

- `TextParser` — TXT/MD 直接读取
- `PDFParser` — 用 `PyMuPDF` 提取文本
- `DocumentProcessor` — 根据后缀选解析器，然后 chunk

依赖：
- `pymupdf` 加到 `pyproject.toml`

**chunk 策略**（参考 ai_agent 的 document_processor）：
- `recursive`（默认）：按段落→句子拆分
- `fixed`：固定 token 数

### 2.2 API 路由

**Create**: `backend/app/api/v1/rag.py`

```python
from fastapi import APIRouter, UploadFile, File, Query

router = APIRouter()

@router.post("/rag/upload/{collection}")
async def upload_document(
    collection: str,
    file: UploadFile = File(...),
    chunk_strategy: str = Query("recursive"),
    chunk_size: int = Query(512),
):
    # 1. 保存到临时文件
    # 2. DocumentProcessor.parse → chunks
    # 3. PgVectorStore.insert_document
    # 4. 返回 document_id
    ...

@router.post("/rag/scrape")
async def scrape_url(
    url: str = Query(...),
    collection: str = "documents",
):
    # 1. trafilatura 抓取
    # 2. DocumentProcessor.parse → chunks
    # 3. PgVectorStore.insert_document
    ...
```

**Modify**: `backend/app/api/v1/api.py` 注册 `rag.router`

### 2.3 前端页面

**Create**: `frontend/src/app/[locale]/knowledge-base/page.tsx`

两个 tab：
- **Tab 1: 上传文档** — 拖拽/点击上传 PDF/TXT/MD，选 collection + chunk 策略
- **Tab 2: URL 爬取** — URL 输入框 + collection 选择

**Create**:
- `frontend/src/components/rag/file-upload.tsx`
- `frontend/src/components/rag/url-scrape-form.tsx`
- `frontend/src/components/rag/document-list.tsx`

前端调用后端 API 时通过 Next.js API route 代理 `/api/v1/rag/...`。

---

## Task 3: RAG 搜索工具 + Agent 集成

**目标**：Agent 能搜 RAG 知识库

### 3.1 搜索工具

**Create**: `backend/app/core/langgraph/tools/rag_search.py`

```python
"""RAG knowledge base search tool for LangGraph agent."""
from langchain_core.tools import tool

@tool
def rag_search(query: str, top_k: int = 5) -> str:
    """Search the knowledge base for relevant information.

    Use for questions about uploaded documents, FAQ, or URL-scraped content.
    """
    # 从 app.state 或全局变量拿 vector_store
    results = await vector_store.search(query, top_k=top_k)
    if not results:
        return "No relevant documents found in the knowledge base."
    formatted = []
    for r in results:
        formatted.append(f"[{r['score']:.2f}] {r['content'][:500]}")
    return "\n\n".join(formatted)
```

**Modify**: `backend/app/core/langgraph/tools/__init__.py`

把 `rag_search` 加入 `tools` 列表。

### 3.2 system prompt 更新

**Modify**: `backend/app/core/prompts/system.md`

加一段 RAG 使用说明（参考 ai_agent prompts.py 的 RAG 部分）：

```markdown
## 知识库搜索

你有 `rag_search` 工具可以搜索知识库。当用户问及：
- 你上传的文档内容
- 网站功能/FAQ
- 需要参考具体资料的问题

...请主动搜索。一般知识直接用你的常识回答，不要什么都搜。
```

---

## Task 4: FAQ 语义缓存

**目标**：用户提问 → embedding 相似度匹配缓存 → 命中直接返回

**Create**: `backend/app/services/rag/faq_cache.py`

用现有 `cache_service` 存 FAQ 对，不做 Redis 向量搜索（仅精确 key 匹配 + query embedding 比较）。

逻辑：
1. 用户提问 → `embedding.embed_query()` → 生成向量
2. 遍历 Redis 缓存的 FAQ 列表（存为 JSON），算 cosine similarity
3. 命中（>0.92）→ 直接返回缓存答案
4. 未命中 → Agent 回答 → 新 Q&A 存入缓存

**接入点**：在 `LangGraphAgent.get_stream_response` 里，调 `graph.astream` 之前先查 FAQ 缓存。

---

## Task 5: FAQ 种子数据

**目标**：Palworld 常见问题的标准答案

**Create**: `backend/data/faq/` 目录

内容范围：帕鲁捕获、培育、工作分配、属性查询、装备合成、网站功能（聊天、地图、卡牌等）

**Create**: `backend/scripts/seed_faq.py`

遍历 `data/faq/*.md`，解析 Q&A 对，调用 embedding + PgVectorStore 灌入。

---

## 依赖清单

### Python（`backend/pyproject.toml`）
- `pymupdf` — PDF 解析
- `pgvector` — pgvector 向量类型
- `trafilatura` — URL 正文提取
- `tiktoken` — token 计数（可选）

### 前端
- shadcn/ui: `Tabs`, `Select`, `Table`, `Toast`

---

## 实施顺序

```
Task 1（embedding + pgvector 基础）
  → Task 2（文件上传 + 解析 + URL 爬取 + UI）
    → Task 3（RAG 搜索工具 + Agent 集成）
      → Task 4（FAQ 缓存）
        → Task 5（FAQ 种子数据）
```

Task 1 是基础依赖，后面的所有 task 都建立在 pgvector + embedding 之上。
