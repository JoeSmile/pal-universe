# Pal Universe — LangGraph Hooks 实战

> Hooks 不是花架子。以下是 Pal Universe 真正用得到的挂载点。

---

## 一、LangGraph 的 Hook 种类

| Hook | 触发时机 | 我们用来做什么 |
|------|---------|-------------|
| `on_node_start` | 节点开始执行前 | 缓存检查 / 成本预算检查 / SSE 推送"正在搜索..." |
| `on_node_end` | 节点执行成功后 | 写入缓存 / 记录成本 / 审计日志 |
| `on_node_error` | 节点抛出异常 | 降级响应 / 错误告警 / 不让用户看到 LLM 错误 |
| `on_llm_start` | LLM 调用前 | **语义缓存查询**（省费用的关键） |
| `on_llm_end` | LLM 返回后 | **语义缓存写入** / **Token 统计** |
| `on_tool_start` | 工具调用前 | 记录工具入参 |
| `on_tool_end` | 工具返回后 | 记录工具结果 / 检查结果质量 |

---

## 二、按模块的 Hook 设计

### 2.1 缓存模块（省费用）

```
LLM 调用前 (on_llm_start)
  │
  └─ 语义缓存查询
     ├─ 命中 → 跳过 LLM 调用 → 直接返回缓存
     └─ 未命中 → 放行 → LLM 调用

LLM 调用后 (on_llm_end)
  │
  └─ 语义缓存写入
     └─ 问题 embedding + 回答 → 写入 Redis RediSearch
```

### 2.2 成本控制模块（防烧钱）

```
LLM 调用前 (on_llm_start)
  │
  ├─ IP 日预算检查
  │  ├─ 超限 → 抛出 BudgetExceeded → on_node_error 接管
  │  └─ 未超限 → 放行
  │
  └─ 全局预算检查
     ├─ 超限 → 降级到本地模式
     └─ 未超限 → 放行

LLM 调用后 (on_llm_end)
  │
  └─ Token 记录
     └─ cost_tracker.record(ip, tokens)
```

### 2.3 审计模块（可追溯）

```
节点开始 (on_node_start)
  │
  └─ 记录工具调用开始
     {node: "rag_retrieval", input: "...", timestamp}

节点结束 (on_node_end)
  │
  └─ 记录工具调用结果
     {node: "rag_retrieval", duration_ms: 234, result_count: 3}

节点错误 (on_node_error)
  │
  └─ 记录错误
     {node: "llm_call", error: "ConnectionError", fallback: "used_local"}
```

### 2.4 用户体验模块（前台反馈）

```
节点开始 (on_node_start)
  │
  ├─ "rag_retrieval" → SSE: "🔍 正在搜索帕鲁数据..."
  ├─ "llm_call"     → SSE: "🤖 AI 正在思考..."
  └─ "web_search"   → SSE: "🌐 正在搜索攻略..."

节点结束 (on_node_end)
  │
  └─ "rag_retrieval" → SSE: "✅ 找到 3 条相关数据"
```

### 2.5 错误降级模块（优雅兜底）

```
节点错误 (on_node_error)
  │
  ├─ LLM 调用超时 (TimeoutError)
  │   → 返回: "AI 服务暂时繁忙，以下是我的本地数据：{context}"
  │   → 不走 LLM，直接用 RAG 结果拼接回答
  │
  ├─ LLM 费用超限 (BudgetExceeded)
  │   → 返回: "今日 AI 额度已用完，搜索功能正常使用"
  │   → 展示搜索建议
  │
  └─ RAG 检索无结果 (NoResultsFound)
      → 不调用 LLM → 返回: "我没找到相关信息，换个问法试试"
```

---

## 三、代码实现

### 3.1 现有代码基

当前 `backend/app/core/langgraph/graph.py` 中已有 LangGraph Agent：

```python
class LangGraphAgent:
    def __init__(self):
        self.graph = self._build_graph()

    def _build_graph(self):
        workflow = StateGraph(AgentState)
        workflow.add_node("agent", self.call_agent)
        workflow.add_node("tools", self.call_tools)
        workflow.set_entry_point("agent")
        return workflow.compile()
```

### 3.2 添加 Hook 层

```python
from langgraph.checkpoint.redis import RedisSaver
from langgraph.graph import StateGraph

class PalUniverseGraph:
    """带 Hook 的 LangGraph"""

    def __init__(self):
        checkpointer = RedisSaver(redis_url="redis://localhost:6379", ttl=86400)
        self.graph = self._build_graph().compile(checkpointer=checkpointer)

    def _build_graph(self):
        workflow = StateGraph(AgentState)
        workflow.add_node("agent", self.call_agent)
        workflow.add_node("tools", self.call_tools)
        workflow.set_entry_point("agent")
        return workflow

    async def stream(self, message: str, thread_id: str):
        """使用 astream_events 获取细粒度事件"""
        async for event in self.graph.astream_events(
            {"messages": [("user", message)]},
            config={"configurable": {"thread_id": thread_id}},
            version="v2",
        ):
            kind = event["event"]
            node = event.get("name", "")

            # ── 缓存检查 hook ──────────────────────
            if kind == "on_chat_model_start" and self._check_cache(message):
                yield {"event": "cached", "content": self._get_cache(message)}
                return

            # ── 工具调用 hook ───────────────────────
            if kind == "on_tool_start":
                audit.record_tool_call(node, event["input"])
                yield {"event": "status", "content": f"🔍 {_tool_label(node)}..."}

            if kind == "on_tool_end":
                audit.record_tool_result(node, event["output"])

            # ── LLM 调用 hook ───────────────────────
            if kind == "on_chat_model_start":
                if cost_tracker.is_ip_over_budget(self._current_ip):
                    yield {"event": "error", "content": "budget_exceeded"}
                    return
                yield {"event": "status", "content": "🤖 AI 正在思考..."}

            if kind == "on_chat_model_stream":
                yield {"event": "chunk", "content": event["content"]}

            # ── 错误 hook ──────────────────────────
            if kind == "on_chain_error":
                audit.record_error(node, str(event["error"]))
                yield {"event": "error", "content": _fallback_response(node)}

            # ── 结果 hook ──────────────────────────
            if kind == "on_chain_end" and node == "agent":
                tokens = _count_tokens(event["output"])
                cost_tracker.record(self._current_ip, tokens)
                self._write_cache(message, event["output"])
```

### 3.3 工具标签映射

```python
_TOOL_LABELS = {
    "pal_search": "🔍 搜索帕鲁数据",
    "breeding_calc": "🧬 计算繁殖组合",
    "breeding_reverse": "🔄 查询父代组合",
    "web_search": "🌐 搜索攻略信息",
    "type_chart": "⚔️ 分析属性克制",
    "location_query": "📍 查询位置数据",
}

def _tool_label(node: str) -> str:
    return _TOOL_LABELS.get(node, f"⚙️ 执行 {node}")

def _fallback_response(node: str) -> str:
    """工具或 LLM 失败时的降级响应"""
    fallbacks = {
        "llm_call": "AI 服务暂时繁忙，你可以直接搜索帕鲁名或使用繁殖计算器",
        "rag_retrieval": "数据检索遇到问题，换个关键词试试",
        "web_search": "攻略搜索暂不可用，试试具体帕鲁名",
    }
    return fallbacks.get(node, "服务异常，请稍后再试")
```

---

## 四、Hook 带来的实际收益

| 模块 | 之前 | 之后 |
|------|------|------|
| LLM 调用 | 每次必调 | 缓存命中 → 0 调用 |
| 预算控制 | 无检查 | LLM 调用前拦截 + 降级 |
| 用户体验 | 干等 3s 无反馈 | SSE 逐段推送状态 |
| 错误处理 | 抛 500 给前端 | 降级响应 + 本地数据兜底 |
| 审计 | 请求级日志 | 节点级追踪，精确到工具调用 |
| 调试 | log 里翻 | Langfuse 看完整调用链 |

---

## 五、实现优先级

| Hook | 优先级 | 工作量 | 收益 |
|------|--------|--------|------|
| `on_chat_model_start` 缓存检查 | **P0** | 0.5 天 | 省 LLM 费用 |
| `on_tool_start/end` 审计 | P1 | 0.5 天 | 链路可追踪 |
| `on_chat_model_start` 预算检查 | P1 | 0.2 天 | 防烧钱 |
| `on_node_error` 降级 | P1 | 0.3 天 | 优雅兜底 |
| SSE 状态推送 | P2 | 0.5 天 | 体验提升 |
