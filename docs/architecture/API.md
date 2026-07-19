# Pal Universe — API 契约

> 前后端对接标准。前端团队和后端团队（或 Agent）以此文档为准。
> 变更必须双方确认后更新本文档。

---

## 概述

- 基础 URL: `http://localhost:8000/api/v1`（开发）/ `https://pal-universe-api.example.com/api/v1`（生产）
- 格式: 全部 JSON
- 认证: Chat API 需要 JWT（`Authorization: Bearer <token>`）；查询类 API 不需要
- 错误格式: `{ "error": { "code": "PAL_NOT_FOUND", "message": "..." } }`

---

## 1. 帕鲁搜索

前端 MVP 阶段先走**前端本地 JSON**，不走此 API。后端就绪后切换。

```
GET /api/pals/search?q={query}&types={types}&work={work}&page=1&per_page=20

Response 200:
{
  "data": [
    {
      "id": 1,
      "name": "Anubis",
      "name_cn": "冥王犬",
      "elements": ["ground"],
      "deck_id": "1",
      "rarity": 4,
      "size": "L",
      "image": "/images/pals/Anubis.webp",
      "stats": { "hp": 130, "melee_attack": 100, "shot_attack": 80, "defense": 80 },
      "work_orders": [{"skill": "mining", "level": 3}, {"skill": "handiwork", "level": 2}],
      "drops": ["pure_quartz", "bone"]
    }
  ],
  "total": 1,
  "page": 1,
  "per_page": 20
}

Response 404:
{ "error": { "code": "PAL_NOT_FOUND", "message": "未找到匹配的帕鲁" } }
```

### 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `q` | string | 否 | 搜索关键词（中英文名模糊匹配） |
| `types` | string | 否 | 逗号分隔的元素类型过滤，如 `fire,ground` |
| `work` | string | 否 | 工作适性过滤，如 `mining` |

---

## 2. 帕鲁详情

```
GET /api/pals/{name}

Response 200:
{
  "data": {
    "name": "Anubis",
    "name_cn": "冥王犬",
    "elements": ["ground"],
    "deck_id": "1",
    "rarity": 4,
    "size": "L",
    "image": "/images/pals/Anubis.webp",
    "stats": { "hp": 130, "melee_attack": 100, "shot_attack": 80, "defense": 80, "support": 70, "stamina": 300, "food": 5 },
    "work_orders": [{"skill": "mining", "level": 3}, {"skill": "handiwork", "level": 2}],
    "skills": [
      { "name": "Ground Pound", "type": "ground", "power": 70, "cooldown": 10, "level": 1 },
      { "name": "Sand Blast", "type": "ground", "power": 100, "cooldown": 15, "level": 7 }
    ],
    "drops": ["pure_quartz", "bone"],
    "breeding_rank": 570,
    "locations": [{"region": "twilight_dunes", "area": "..."}]
  }
}

Response 404:
{ "error": { "code": "PAL_NOT_FOUND", "message": "帕鲁 Anubis 不存在" } }
```

---

## 3. 繁殖计算

### 3.1 父代→子代

```
GET /api/breeding/calculate?parent1=Anubis&parent2=Cattiva

Response 200:
{
  "data": {
    "parent1": { "name": "Anubis", "rank": 570 },
    "parent2": { "name": "Cattiva", "rank": 1460 },
    "result": { "name": "Robinquill", "rank": 1015 },
    "formula": "⌊(570 + 1460 + 1) / 2⌋ = 1015",
    "is_special": false
  }
}
```

### 3.2 子代→父代

```
GET /api/breeding/reverse?target=Anubis

Response 200:
{
  "data": {
    "target": "Anubis",
    "combinations": [
      { "parent1": "Penking", "parent2": "Vanwyrm Cryst" },
      { "parent1": "Bushi", "parent2": "Felbat" }
    ],
    "special_combinations": []
  }
}
```

### 3.3 多代推演

```
GET /api/breeding/path?start=Anubis&target=Jetragon&generations=5

Response 200:
{
  "data": {
    "steps": [
      { "parent1": "Anubis", "parent2": "Cattiva", "child": "Robinquill", "generation": 1 },
      { "parent1": "Anubis", "parent2": "Robinquill", "child": "Arsox", "generation": 2 }
    ],
    "total_generations": 6,
    "possible": true
  }
}
```

---

## 4. AI 聊天

### 4.1 流式聊天

```
POST /api/v1/chat/stream
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "messages": [
    { "role": "user", "content": "怎么繁殖 Anubis？" }
  ],
  "conversation_id": null
}

Response: SSE Stream (text/event-stream)

data: {"type": "text", "content": "要繁殖 Anubis，你可以用以下组合："}
data: {"type": "pal_ref", "content": {"name": "Penking", "name_cn": "企丸王"}}
data: {"type": "text", "content": " + "}
data: {"type": "pal_ref", "content": {"name": "Vanwyrm Cryst", "name_cn": "冰翼冥龙"}}
data: {"type": "done", "content": {"conversation_id": "abc123"}}
```

SSE 事件类型：

| 事件 | data 格式 | 说明 |
|------|-----------|------|
| `type: text` | `{"type":"text","content":"..."}` | 普通文本片段 |
| `type: pal_ref` | `{"type":"pal_ref","content":{"name":"...","name_cn":"..."}}` | 帕鲁引用，前端可渲染为可点击链接 |
| `type: done` | `{"type":"done","content":{"conversation_id":"..."}}` | 流结束 |

### 4.2 对话历史

```
GET /api/v1/messages
Authorization: Bearer <jwt>

Response 200:
{
  "messages": [
    { "role": "user", "content": "...", "timestamp": "..." },
    { "role": "assistant", "content": "...", "timestamp": "..." }
  ]
}
```

```
DELETE /api/v1/messages
Authorization: Bearer <jwt>

Response 200:
{ "message": "对话历史已清空" }
```

---

## 5. 地图

```
GET /api/map/pal-locations?pal_name=Anubis

Response 200:
{
  "data": [
    {
      "pal_name": "Anubis",
      "region": "twilight_dunes",
      "coordinates": { "x": -234, "y": 456 },
      "level_range": { "min": 30, "max": 35 },
      "time": "day",
      "is_alpha": true
    }
  ]
}
```

---

## 6. 通用错误码

| HTTP 状态码 | code | 说明 |
|-------------|------|------|
| 400 | `INVALID_PARAMS` | 参数错误 |
| 404 | `PAL_NOT_FOUND` | 帕鲁不存在 |
| 404 | `BREEDING_NOT_FOUND` | 繁殖组合不存在 |
| 429 | `RATE_LIMITED` | 请求过快 |
| 500 | `INTERNAL_ERROR` | 服务器内部错误 |
