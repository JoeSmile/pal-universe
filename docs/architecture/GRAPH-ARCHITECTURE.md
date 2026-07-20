# Pal Universe — LangGraph Workflow 现状与扩展方案

---

## 一、当前图结构

```
                     ┌──────────┐
                     │  chat     │ ← 入口
                     │           │
                     │ LLM 调用  │
                     │ tool_calls│←─┐
                     │ 判断      │  │
                     └──┬───────┘  │
                        │          │
            ┌───────────┴──────────┴───┐
            │ 有 tool_calls?           │
            │                          │
            ├─ YES ─→ tool_call ───────┘
            │           │ 执行工具
            │           │ goto "chat"
            │
            └─ NO ─→ END
```

**关键参数：**
| 属性 | 值 |
|------|-----|
| 图数量 | **1 张** |
| 节点数 | **2 个**（chat, tool_call） |
| 模式 | **ReAct**（Reason + Act） |
| Checkpointer | AsyncPostgresSaver |
| Tools | duckduckgo_search, ask_human |
| 入口 | chat |
| 终止 | chat 无 tool_calls → END |

---

## 二、当前模式：ReAct

**ReAct = Reason + Act。** 核心流程：

```
用户说 "怎么繁殖 Anubis"
  │
  ├─ chat 节点: LLM 推理 → "我需要查繁殖数据"
  │               调用 tool: pal_search("Anubis")
  │               ↓
  ├─ tool_call: 查到 Penking + Vanwyrm Cryst = Anubis
  │               ↓
  ├─ chat 节点: LLM 推理 → "Penking 和 Vanwyrm Cryst 在哪里抓？"
  │               调用 tool: location_query("Penking")
  │               ↓
  ├─ tool_call: 查到 Penking 在雪山
  │               ↓
  ├─ chat 节点: LLM 推理 → "够了，组织回答"
  │               ↓
  └─ END → 返回最终回答
```

**不是 plan-and-execute**（没有"先规划再执行"的分工），而是**边推理边行动**。

---

## 三、如何管理

### 3.1 当前管理方式

```
backend/app/core/langgraph/
├── __init__.py
├── graph.py          ← 唯一的图类 LangGraphAgent
└── tools/
    ├── __init__.py   ← 注册所有工具
    ├── ask_human.py
    └── duckduckgo_search.py

单一的 LangGraphAgent 单例:
  agent = LangGraphAgent()
  graph = await agent.create_graph()
```

### 3.2 问题

```
问题 1: 一张图塞所有逻辑
  繁殖、位置、配队、Chat 全部在这 2 个节点里
  新增功能只能加工具，不能加节点
  → 未来需要"配队专用图"时只能硬塞

问题 2: Checkpointer 用 Postgres
  已有 AsyncPostgresSaver
  但 Postgres 做 checkpointer 慢，且无 TTL 自动清理
  → 应该换成 RedisSaver

问题 3: 只有 2 个 tool
  duckduckgo_search + ask_human
  我们自己的 6 个工具 (pal_search/breeding等) 还没注册进去
```

---

## 四、新 Workflow 设计方案

### 4.1 多图工厂模式

```
backend/app/core/langgraph/
├── __init__.py
├── registry.py          ← 图注册表（新增）
├── factory.py           ← 图工厂（新增）
├── base_graph.py        ← 抽象基类（新增）
├── graphs/
│   ├── __init__.py
│   ├── chat_graph.py    ← 对话图（ReAct，现有）
│   ├── breeding_graph.py ← 繁殖专用图（新增，Phase 2）
│   └── team_graph.py    ← 队伍分析图（新增，Phase 2）
├── nodes/               ← 共享节点（新增）
│   ├── __init__.py
│   ├── tool_runner.py   ← 工具执行节点
│   └── rag_retrieval.py ← RAG 检索节点
├── tools/
│   ├── __init__.py      ← 注册所有工具
│   ├── pal_search.py    ← 新增
│   ├── breeding_calc.py ← 新增
│   └── ...
└── checkpointer.py      ← Checkpointer 工厂（新增）
```

### 4.2 图注册表

```python
# backend/app/core/langgraph/registry.py

from typing import Protocol

class LangGraphProtocol(Protocol):
    """所有图必须实现的方法"""
    name: str
    async def stream(self, input: dict, config: dict) -> AsyncGenerator: ...
    async def invoke(self, input: dict, config: dict) -> dict: ...

_REGISTRY: dict[str, type[LangGraphProtocol]] = {}

def register(name: str):
    """装饰器：注册一张图"""
    def wrapper(cls):
        _REGISTRY[name] = cls
        cls.name = name
        return cls
    return wrapper

def get_graph(name: str) -> type[LangGraphProtocol]:
    if name not in _REGISTRY:
        raise KeyError(f"Graph '{name}' not registered. Available: {list(_REGISTRY.keys())}")
    return _REGISTRY[name]

# 使用
@register("chat")
class ChatGraph:
    """对话 ReAct 图"""
    ...

@register("breeding")
class BreedingGraph:
    """繁殖计算专用图"""
    ...
```

### 4.3 Checkpointer 工厂

```python
# backend/app/core/langgraph/checkpointer.py

from langgraph.checkpoint.redis import RedisSaver

def create_checkpointer():
    """根据环境选择 Checkpointer"""
    if settings.REDIS_URL:
        return RedisSaver(
            redis_url=settings.REDIS_URL,
            ttl=86400,  # 24h 自动过期
        )
    # Redis 不可用时降级到内存
    from langgraph.checkpoint.memory import MemorySaver
    return MemorySaver()
```

### 4.4 ReAct 图增强（现在就能做）

```
当前图:                         增强后:
 chat ──→ tool_call ──→ chat      chat ──→ tool_call ──→ rag_retrieval
  │                                │         │              │
  └── 2 tools, 无 checkpointer     │         │              │
                                   │         │              │
                                   │         └── 6 tools   │
                                   │                        │
                                   └── RAG 节点 (缓存检查) ──┘
                                   
新增节点:
  rag_retrieval: 缓存查询 + pgvector 语义检索
    → 缓存命中 → 直接返回，不走 LLM
    → 未命中 → 拼接 context → 传给 chat

新增工具:
  pal_search / breeding_calc / breeding_reverse
  location_query / type_chart / web_search (已有)
```

---

## 五、扩展便利性评估

| 操作 | 难度 | 需要改什么 |
|------|------|-----------|
| 加一个新 Tool | **简单** | 1. tools/ 下新建文件 2. tools/__init__.py 注册 |
| 加一个新 Node | **简单** | graph.py 加 `add_node()` + 一个函数 |
| 加一个新 Graph | **中等** | 现有架构需要拆成工厂模式 |
| 换 Checkpointer | **简单** | 改 `create_graph()` 里的一行 |
| 切 RedisSaver | **简单** | 替换 `AsyncPostgresSaver` → `RedisSaver` |

---

## 六、推荐实施步骤

```
Step 1 (P0): 注册 Pal Universe 自己的 6 个 Tool
  目前只有 duckduckgo_search + ask_human
  把 pal_search / breeding_calc / breeding_reverse / location_query / type_chart 注册进去
  ↓ 工作量: 1 天

Step 2 (P0): 切 RedisSaver Checkpointer
  AsyncPostgresSaver → RedisSaver(ttl=86400)
  多轮对话生效
  ↓ 工作量: 0.5 天

Step 3 (P1): 加 RAG Node
  chat → tool_call → rag_retrieval → chat
  缓存检查 + pgvector 检索
  ↓ 工作量: 1 天

Step 4 (P2): 图工厂模式
  注册表 + 多图支持
  ↓ 工作量: 2 天
```
