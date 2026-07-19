# Pal Universe — AI Chat 成本控制策略

> 目标：在提供流畅 AI 体验的同时，将 LLM API 费用控制在可控范围内。
> 策略：能不调 LLM 就不调，能缓存就缓存，能降级就降级。

---

## 一、预算红线

| 指标 | 阈值 | 行动 |
|------|------|------|
| 月总费用 | $50 | 触发告警，人工审查 |
| 日费用 | $3 | 触发告警 |
| 单次对话费用 | $0.02 | 检查是否异常的复杂查询 |
| API 错误率 > 5% | 日维度 | 自动切换到备用模型 |

---

## 二、三层分级处理

```
用户问题
    │
    ▼
┌─────────────────────────────────────┐
│  Layer 1: 本地精确匹配              │  ← 零成本
│  命中关键词 + 意图明确 → 直接查 JSON │
│  示例："Anubis 什么属性？"           │
│  预计覆盖: ~40% 请求                 │
└─────────────────────────────────────┘
    │ 未命中
    ▼
┌─────────────────────────────────────┐
│  Layer 2: 缓存命中                   │  ← 几乎零成本
│  相同/相似问题 → 返回缓存回答          │
│  缓存 TTL: 24h                       │
│  缓存容量: 最近 500 条热门问答         │
│  预计覆盖: ~30% 请求                  │
└─────────────────────────────────────┘
    │ 未命中
    ▼
┌─────────────────────────────────────┐
│  Layer 3: LLM 调用                  │  ← 有成本
│  只有前两层都未命中时才调 LLM         │
│  模型: DeepSeek V4 Flash (低成本)    │
│  max_tokens: 1024                   │
│  预计覆盖: ~30% 请求                  │
└─────────────────────────────────────┘
```

---

## 三、Layer 1 — 本地精确匹配

```python
# 意图 → 本地查询函数 映射
INTENT_MAP = {
    # 帕鲁属性查询: "Anubis 什么属性"
    r"(?P<name>\w+)\s*(属性|类型|元素)": "query_pal_elements",
    # 工作查询: "哪些帕鲁适合挖矿"
    r"(哪些|什么).*?(挖矿|采矿|mining)": "query_pal_by_work",
    # 繁殖查询: "怎么繁殖 Anubis"
    r"(怎么|如何).*?繁殖.*?(?P<name>\w+)": "query_breeding_reverse",
}
```

**实现位置：** 前端先做，MVP 阶段直接在前端匹配。后端就绪后移到后端 API。

---

## 四、Layer 2 — 缓存策略

```python
# 缓存 key = 归一化后的问题
def cache_key(query: str) -> str:
    return hashlib.md5(query.strip().lower().encode()).hexdigest()

# 缓存存储（内存 LRU）
CACHE = {}
CACHE_MAX = 500
CACHE_TTL = 86400  # 24h
```

前端开发阶段可以直接用 `localStorage` 做缓存。

---

## 五、Layer 3 — LLM 调用规则

| 规则 | 值 |
|------|-----|
| 模型 | DeepSeek V4 Flash（或 equivalente 低成本模型） |
| max_tokens | 1024（回答长度限制） |
| 单用户频率 | 10次/分钟（未登录） / 60次/分钟（登录） |
| 超时 | 15s（超过则返回降级响应） |
| 降级响应 | "我暂时无法回答这个问题，建议搜索帕鲁名称查询" |

### 降级流水线

```
LLM 超时 / 报错
    │
    ▼
尝试备用模型（如有配置）
    │
    ▼
备用模型也失败 → 降级响应（不上报错误，用户看到友好提示）
```

**绝不把 LLM 错误暴露给用户。**

---

## 六、每日/每月预算控制

```python
# 伪代码 — 部署在 API 网关层
class BudgetController:
    DAILY_LIMIT = 3.0   # 美元
    MONTHLY_LIMIT = 50.0

    def allow_request(self) -> bool:
        today_cost = redis.get(f"cost:{date.today()}") or 0.0
        month_cost = redis.get(f"cost:{date.today().month}") or 0.0
        if today_cost > self.DAILY_LIMIT or month_cost > self.MONTHLY_LIMIT:
            return False  # 触发降级，所有请求走 Layer 1+2
        return True
```

超预算后 → 所有请求走本地匹配 + 缓存，不再调 LLM。用户无感知。

---

## 七、费用估算

| 场景 | 月请求量 | LLM 调用占比 | 预估月费 |
|------|---------|-------------|---------|
| MVP（仅你使用） | ~1000 | 30% = 300 | ~$0.30 |
| 小型社区（100 DAU） | ~30000 | 30% = 9000 | ~$9.00 |
| 活跃（1000 DAU） | ~300000 | 30% = 90000 | ~$90 ❌ |

1000 DAU 时已经超预算。**届时必须优化 Layer 1 匹配率到 60%+**，或换更便宜的模型。

---

## 八、MVP 阶段实现方案

Phase 1 前端 mock 模式下：

```typescript
// chat-store.ts — 伪代码
async function sendMessage(msg: string) {
  // 1. 检查本地意图匹配（Layer 1）
  const local = matchLocalIntent(msg);
  if (local) return local;

  // 2. 检查缓存（Layer 2）
  const cached = checkCache(msg);
  if (cached) return cached;

  // 3. 调后端 API（Layer 3）
  // 后端 LLM 调用逻辑由 backend 处理
  return callChatAPI(msg);
}
```
