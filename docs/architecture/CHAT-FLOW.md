# Pal Universe — AI Chat 完整技术方案

> 前后端全链路设计 · 缓存策略 · 数据存储 · 安全审计
> 无用户系统下的兜底方案

---

## 一、全链路请求流

```
用户输入 "Anubis 怎么繁殖？"
  │
  ▼
┌──────────────────────────────────────────────────┐
│  前端 (Next.js)                                   │
│                                                    │
│  1. 输入框路由判断                                  │
│     "Anubis 怎么繁殖？" ← 含疑问词 → Chat          │
│                                                    │
│  2. 取 conversation_id                             │
│     localStorage.getItem('chat_conversation_id')   │
│     有 → 传已有 ID                                 │
│     无 → 传 null（后端创建新 ID）                    │
│                                                    │
│  3. POST /chat/stream                              │
│     {                                              │
│       "conversation_id": "abc123",                 │
│       "message": "Anubis 怎么繁殖？"               │
│     }                                              │
│                                                    │
│  4. SSE 接收                                       │
│     event: chunk → {content: "Anubis..."}          │
│     event: done  → {conversation_id: "abc123"}    │
│                                                    │
│  5. 存储 conversation_id                           │
│     localStorage.setItem(...)                      │
│  6. 渲染对话气泡                                    │
└──────────────────────┬───────────────────────────┘
                       │ HTTPS
                       ▼
┌──────────────────────────────────────────────────┐
│  后端 (FastAPI)                                   │
│                                                    │
│  ① Request 进入                                   │
│     │                                              │
│  ② AuditMiddleware                                │
│     记录: path/IP/user-agent/timestamp             │
│     │                                              │
│  ③ CircuitBreakerMiddleware                       │
│     IP 日 tokens > 5万？ → 429 BUDGET_EXCEEDED     │
│     全局日 tokens > 50万？→ 429 BUDGET_EXCEEDED    │
│     │                                              │
│  ④ Schema 校验 (Pydantic ChatRequestV2)           │
│     conversation_id: str|null                      │
│     message: str(1-2000)                           │
│     │                                              │
│  ⑤ Rate Limit (slowapi)                           │
│     /chat/stream: 5/min per IP                     │
│     │                                              │
│  ⑥ LangGraph Agent                                 │
│     │                                              │
│     ├─ Step A: 语义缓存查询                        │
│     │   Redis Stack · RediSearch                   │
│     │   message → embedding                        │
│     │   向量检索相似度 > 0.92？                     │
│     │   ✅ 命中 → 直接返回缓存回答（0 LLM 调用）    │
│     │   ❌ 未命中 → 进入 Step B                     │
│     │                                              │
│     ├─ Step B: RAG 检索                            │
│     │   pgvector · 语义相似度                      │
│     │   message → embedding                        │
│     │   检索 pals 表 → 找到相关帕鲁                 │
│     │   检索 breeding 表 → 找到繁殖信息             │
│     │   拼接 context                                │
│     │                                              │
│     ├─ Step C: LLM 调用                            │
│     │   DeepSeek API                               │
│     │   system: 你是 Pal Universe 助手...           │
│     │   context: {检索到的帕鲁/繁殖数据}            │
│     │   message: "Anubis 怎么繁殖？"               │
│     │                                              │
│     └─ Step D: SSE 流式返回                        │
│         event: chunk → {content: "Penking..."}     │
│         event: chunk → {content: "+ Vanwyrm..."}   │
│         event: done → {conversation_id, tokens}    │
│     │                                              │
│  ⑦ 异步（不阻塞响应）                               │
│     Audit: 记录 tokens_used                         │
│     CostTracker: IP += tokens                       │
│     缓存: 写入 Redis 语义缓存（question+answer）    │
│                                                    │
└──────────────────────────────────────────────────┘
```

---

## 二、缓存策略

### 2.1 三层缓存架构

```
                 用户问 "Anubis 怎么繁殖？"
                          │
                    ┌─────▼─────┐
                    │   浏览器    │  ← 第一层：localStorage
                    │   LRU 50条  │     精确匹配（同一句话）
                    └─────┬─────┘
                          │ 未命中
                    ┌─────▼─────┐
                    │  Redis     │  ← 第二层：Redis Stack
                    │  RediSearch│     语义匹配（embedding > 0.92）
                    │  向量索引   │     TTL 24h
                    └─────┬─────┘
                          │ 未命中
                    ┌─────▼─────┐
                    │  L2 缓存   │  ← 第三层：内存 LRU
                    │  200 条    │     启动预热 Top 100
                    │  LRU 淘汰   │     进程级共享
                    └─────┬─────┘
                          │ 未命中 → LLM 调用
```

### 2.2 缓存写入时机

```
LLM 返回完整回答后（SSE done 事件触发）

  ─ 异步写入 Redis RediSearch 语义缓存
    key:    emb(question) → 向量索引
    value: {answer, tokens_saved, timestamp}
    TTL:   24h

  ─ 写入本地 LRU 缓存（最近 200 条）
    key:   normalized(question) → md5
    value: answer
    淘汰:  LRU
```

### 2.3 缓存命中率预估

| 缓存层 | 命中率 | 节省成本 |
|--------|--------|---------|
| 浏览器 localStorage | ~5% | 零网络开销 |
| Redis 语义缓存 | ~30% (同类问题多) | 省 LLM 调用 |
| 内存 LRU | ~10% (热点问题) | 省网络 + LLM |
| **合计** | **~45%** | **月费减半** |

---

## 三、数据存储

### 3.1 Conversation 历史

由于没有用户系统，conversation 只能通过 `conversation_id` 关联。

```
存储方式:
  ├─ 后端内存（默认）: conversation_id → [{role, content}, ...]
  │   ↑ 开发用，重启丢失
  │
  ├─ Redis（推荐生产）: conv:abc123 → JSON[{role, content}]
  │   TTL: 24h（上次消息后 24h 过期）
  │   截断: 最多 20 轮（超过则压缩旧轮次为摘要）
  │
  └─ PostgreSQL（不推荐）: 表 conversations(id, messages, timestamps)
      太慢，需要 TTL 清理，不如 Redis
```

### 3.2 前端 localStorage

```
key: chat_conversation_id
value: "abc123"

key: chat_messages_abc123
value: [{"role":"user","content":"..."}, {"role":"assistant","content":"..."}]

思路: 前端显示从 localStorage 读，后端推理从 Redis 读
刷新页面 → 前端从 localStorage 恢复 conversation_id
        → 继续会话（后端 Redis 中还有历史）
关闭浏览器 → localStorage 保留
        → 回来继续（24h 内 Redis 也有）
```

### 3.3 数据生命周期

```
用户问问题
  │
  ├─ Redis: 写会话历史 + 24h TTL
  ├─ Redis: 写语义缓存 + 24h TTL
  ├─ 审计日志: 写 JSONL 文件（永久保留，按天归档）
  └─ 成本追踪: 写内存 + Valkey（当日重置）

24h 后:
  ├─ Redis TTL 到期 → 会话自动删除
  ├─ 语义缓存删除
  └─ 用户想继续聊天 → 需要新 conversation_id
      （前端显示旧对话，但后端无法继续——提示"会话已过期"）
```

---

## 四、安全管理（无用户系统）

### 4.1 能做什么

| 措施 | 实现 | 效果 |
|------|------|------|
| 基于 IP 的限流 | slowapi 5/min | 防止单 IP 打爆 |
| 基于 IP 的成本熔断 | CircuitBreakerMiddleware | 防烧 token |
| 审计日志 | audit.py | 事后追踪 |
| 输入校验 | Pydantic max_length=2000 | 防注入 |
| 输出过滤 | 前端 React safe render | 防 XSS |

### 4.2 不能做什么

```
❌ 不能封禁用户（没有用户 ID）
   → 替代: 封禁 IP（但动态 IP 无效）
   → 替代: 封禁 User-Agent（可伪造）
   
❌ 不能做个性收藏/历史（没有用户系统）
   → 替代: localStorage 本地存

❌ 不能做使用量统计的"谁在用"
   → 替代: 聚合统计（今天多少人问了问题）
```

### 4.3 审计日志——唯一的追溯手段

```
每行 JSONL 记录:
{
  "timestamp": "2026-07-19T18:00:00Z",
  "ip": "1.2.3.4",                    ← 来源 IP
  "path": "/api/v1/chat/stream",      ← 端点
  "status": 200,                       ← 结果
  "tokens_used": 156,                  ← 成本
  "duration_ms": 2340,                 ← 延迟
  "conversation_id": "abc123",         ← 会话 ID
  "error_code": null                   ← 异常
}

审计用途:
  ├─ 发现异常 IP：搜同一 IP 在一小时内发了 100 次 chat
  ├─ 发现异常问题：搜同一 conversation_id 的问题内容
  ├─ 成本分布：聚合 tokens_used 看谁是消耗大户
  └─ 错误率：聚合 error_code 看服务是否稳定
```

### 4.4 熔断触发后的用户体验

```
用户频繁调 AI Chat：
  │
  ├─ 第 6 次/min → RateLimit: 429
  │   提示: "请求过于频繁，请稍后再试"
  │
  ├─ IP 日 tokens > 5万 → CircuitBreaker: 429 BUDGET_EXCEEDED
  │   提示: "今日 AI 使用额度已用完，明天再来吧"
  │   前端: 显示本地匹配结果（不走 LLM）
  │
  └─ 全局日 tokens > 50万 → 全员降级
      所有 Chat 请求返回本地预设回答
      不再调用 DeepSeek
```

---

## 五、与前端搜索框的交互

搜索框和 Chat 的关系：

```
用户输入
  │
  ├─ 短词 (1-5字) + 前缀匹配命中
  │   展示搜索下拉
  │   按 Enter → 跳转详情页
  │   按 ⌘+Enter → 进入 Chat（携带搜索词上下文）
  │
  ├─ 短词 + 前缀匹配 = 0
  │   展示 "您是不是要找: XXX"（拼写纠错）
  │   都不对 → 按 Enter 进入 Chat
  │
  ├─ 长句/含疑问词
  │   不展示搜索下拉
  │   按 Enter → 直接进入 Chat
  │
  └─ Chat 模式下
      输入框切换为 Chat 输入
      底部展示对话气泡
      顶部显示 conversation_id（可复制分享）
```
