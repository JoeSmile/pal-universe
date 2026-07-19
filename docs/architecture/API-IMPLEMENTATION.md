# Pal Universe — API 层实现规范

> 配合 `docs/architecture/API-GATEWAY.html` 阅读。
> 定义 backend 的模块结构、中间件实现标准、代码规范。

---

## 一、模块结构

```
backend/app/api/v1/
├── __init__.py
├── api.py              # 路由注册（APIRouter 聚合）
├── pals.py             # 帕鲁查询
├── breeding.py         # 繁殖计算
├── chat.py             # AI 聊天（复用已有 chatbot.py）
├── map.py              # 地图数据
└── items.py            # 物品查询（Phase 2）

backend/app/core/
├── middleware.py        # 审计 · 成本 · 熔断中间件
├── audit.py            # 审计日志写入
├── cost_tracker.py     # 成本计量逻辑
├── circuit_breaker.py  # 熔断判断
└── limiter.py          # Rate Limit（已有）
```

---

## 二、中间件实现标准

### 2.1 AuditMiddleware

```python
# backend/app/core/middleware.py
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import structlog
import time
import uuid

logger = structlog.get_logger()

class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 健康检查不记录
        if request.url.path == "/health":
            return await call_next(request)

        start = time.time()
        request_id = str(uuid.uuid4())[:8]
        response: Response = await call_next(request)
        duration = int((time.time() - start) * 1000)

        # 结构化审计日志
        logger.info("api_request", 
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            ip=request.client.host if request.client else "unknown",
            status=response.status_code,
            duration_ms=duration,
        )
        return response
```

### 2.2 CostTrackingMiddleware

```python
class CostTrackingMiddleware(BaseHTTPMiddleware):
    """追踪 LLM token 消耗，按 IP 聚合"""
    
    async def dispatch(self, request: Request, call_next):
        # 只追踪 chat 端点
        if "/chat/" not in request.url.path:
            return await call_next(request)

        response = await call_next(request)
        ip = request.client.host if request.client else "unknown"
        
        # 从 response header 中读取 LLM token 消耗
        # 由 LLM 调用方写入 header
        tokens = response.headers.get("X-Tokens-Used")
        if tokens:
            cost_tracker.record(ip, int(tokens))
        
        return response
```

### 2.3 CircuitBreakerMiddleware

```python
class CircuitBreakerMiddleware(BaseHTTPMiddleware):
    """预算超限自动降级"""
    
    async def dispatch(self, request: Request, call_next):
        if "/chat/" not in request.url.path:
            return await call_next(request)

        ip = request.client.host if request.client else "unknown"
        
        if cost_tracker.is_over_budget(ip):
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=429,
                content={
                    "error": {
                        "code": "BUDGET_EXCEEDED",
                        "message": "当前预算已超限，请稍后再试"
                    }
                },
            )
        
        return await call_next(request)
```

---

## 三、各模块接口定义

### 3.1 pals.py — 帕鲁查询

```python
from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/pals", tags=["pals"])

# ─── Schema ────────────────────────────────────────
class PalSearchParams(BaseModel):
    q: str = Query("", min_length=0, max_length=50, description="搜索关键词")
    types: Optional[list[str]] = Query(None, description="元素类型过滤")
    work: Optional[str] = Query(None, description="工作适性过滤")
    page: int = Query(1, ge=1, le=100)
    per_page: int = Query(20, ge=1, le=50)

class PalResponse(BaseModel):
    name: str
    name_cn: str
    elements: list[str]
    deck_id: str
    rarity: int
    image: str  # /images/pals/{name}.webp

# ─── 端点 ──────────────────────────────────────────
@router.get("/search", summary="帕鲁搜索")
async def search_pals(params: PalSearchParams = Query()):
    """按名称/元素/工作搜索帕鲁"""
    # 待实现：pgvector 全文搜索 + 过滤
    ...

@router.get("/{name}", summary="帕鲁详情")
async def get_pal(name: str):
    """获取单只帕鲁完整信息"""
    ...
```

### 3.2 breeding.py — 繁殖计算

```python
router = APIRouter(prefix="/breeding", tags=["breeding"])

@router.get("/calculate", summary="父代→子代")
async def calculate(parent1: str, parent2: str):
    """两只帕鲁的繁殖结果"""
    ...

@router.get("/reverse", summary="子代→父代")
async def reverse(target: str):
    """查目标帕鲁的所有父代组合"""
    ...

@router.get("/path", summary="多代推演")
async def breeding_path(start: str, target: str, generations: int = 5):
    """从起始帕鲁到目标帕鲁的繁殖路线"""
    ...
```

### 3.3 chat.py — AI 聊天

复用已有的 `backend/app/api/v1/chatbot.py`，仅补充 Schema 校验和成本追踪 header 写入：

```python
# 在 response 中注入 token 消耗
response.headers["X-Tokens-Used"] = str(tokens_used)
```

---

## 四、错误响应规范

所有端点保持一致的错误格式：

```python
# 成功
{"data": {...}}

# 失败
{"error": {"code": "PAL_NOT_FOUND", "message": "帕鲁 Anubis 不存在"}}
```

错误码映射：

| HTTP | code | 中间件/模块 | 说明 |
|------|------|------------|------|
| 400 | VALIDATION_ERROR | Pydantic | 参数类型或范围错误 |
| 400 | INVALID_PARAMS | 业务模块 | 业务参数不合法 |
| 404 | PAL_NOT_FOUND | pals.py | 帕鲁不存在 |
| 404 | BREEDING_NOT_FOUND | breeding.py | 繁殖组合不存在 |
| 429 | RATE_LIMITED | RateLimitMiddleware | 频率超限 |
| 429 | BUDGET_EXCEEDED | CircuitBreakerMiddleware | 预算超限 |
| 500 | INTERNAL_ERROR | 全局 | 未捕获异常 |
| 502 | LLM_GATEWAY_ERROR | chat.py | AI 服务不可用 |

---

## 五、Node 注册

```python
# backend/app/api/v1/api.py
from fastapi import APIRouter
from .pals import router as pals_router
from .breeding import router as breeding_router
from .chat import router as chat_router
from .map import router as map_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(pals_router)
api_router.include_router(breeding_router)
api_router.include_router(chat_router)
api_router.include_router(map_router)
```

---

## 六、与现有后端的集成

后端 `backend/app/api/v1/` 已经存在以下文件：

```
现有:                         新加:
├── api.py                   ├── pals.py (新)
├── chatbot.py (保留)         ├── breeding.py (新)
├── auth.py (保留)            ├── map.py (新)
└── ...                       └── items.py (Phase 2)
```

中间件在 `backend/app/core/middleware.py` 已有基础框架，扩展审计和成本逻辑即可。
