"""Custom middleware for tracking metrics and other cross-cutting concerns."""

import json
import time
from typing import TYPE_CHECKING, Callable, override

from fastapi import Request
from fastapi.responses import JSONResponse
from jose import JWTError, jwt
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.core.audit import record as audit_record
from app.core.config import settings
from app.core.cost_tracker import RateLimitExceeded, cost_tracker
from app.core.logging import bind_context, clear_context, logger
from app.core.metrics import http_request_duration_seconds, http_requests_total

if TYPE_CHECKING:
    from pyinstrument import Profiler
    from pyinstrument.renderers import JSONRenderer
    PYINSTRUMENT_AVAILABLE = True
else:
    try:
        from pyinstrument import Profiler
        from pyinstrument.renderers import JSONRenderer
        PYINSTRUMENT_AVAILABLE = True
    except ImportError:
        Profiler = None
        JSONRenderer = None
        PYINSTRUMENT_AVAILABLE = False


class MetricsMiddleware(BaseHTTPMiddleware):
    """Middleware for tracking HTTP request metrics."""

    @override
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        status_code = 500
        try:
            response = await call_next(request)
            status_code = response.status_code
        except Exception:
            raise
        finally:
            duration = time.time() - start_time
            http_requests_total.labels(method=request.method, endpoint=request.url.path, status=status_code).inc()
            http_request_duration_seconds.labels(method=request.method, endpoint=request.url.path).observe(duration)
        return response


class LoggingContextMiddleware(BaseHTTPMiddleware):
    """Middleware for adding user_id and session_id to logging context."""

    @override
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            clear_context()
            auth_header = request.headers.get("authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                try:
                    payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
                    session_id = payload.get("sub")
                    if session_id:
                        bind_context(session_id=session_id)
                except JWTError:
                    pass
            response = await call_next(request)
            if hasattr(request.state, "user_id"):
                bind_context(user_id=request.state.user_id)
            return response
        finally:
            clear_context()


class AuditMiddleware(BaseHTTPMiddleware):
    """Middleware for recording API request audit logs."""

    @override
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if request.url.path == "/health":
            return await call_next(request)
        start = time.time()
        response = await call_next(request)
        duration = int((time.time() - start) * 1000)
        tokens = response.headers.get("X-Tokens-Used")
        error_code = None
        if response.status_code >= 400:
            try:
                body = getattr(response, "body", None)
                if body:
                    err = json.loads(body)
                    detail = err.get("detail", {})
                    error_code = detail.get("code") if isinstance(detail, dict) else None
            except Exception:
                pass
        audit_record(
            method=request.method,
            path=request.url.path,
            ip=request.client.host if request.client else "unknown",
            user_agent=request.headers.get("user-agent"),
            status=response.status_code,
            duration_ms=duration,
            tokens_used=int(tokens) if tokens else None,
            error_code=error_code,
        )
        return response


class CircuitBreakerMiddleware(BaseHTTPMiddleware):
    """Middleware for LLM budget circuit breaking + rate limiting."""

    @override
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if "/chat/" not in request.url.path:
            return await call_next(request)

        ip = request.client.host if request.client else "unknown"

        # Extract user_id from auth token (if present)
        user_id = None
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            try:
                token = auth_header.split(" ")[1]
                payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
                # create_access_token stores user id in "sub"
                raw_id = payload.get("user_id") or payload.get("sub")
                if raw_id is not None:
                    user_id = int(raw_id)
            except (JWTError, TypeError, ValueError):
                pass

        # Check rate limits
        try:
            cost_tracker.check_chat_rate(ip, user_id)
        except RateLimitExceeded as e:
            logger.warning("rate_limit_exceeded", ip=ip, code=e.code)
            return JSONResponse(
                status_code=429,
                content={"error": {"code": e.code, "message": e.message}},
                headers={"Retry-After": str(e.retry_after)},
            )

        # Check token budget
        if cost_tracker.is_ip_over_budget(ip):
            logger.warning("circuit_breaker_ip_budget_exceeded", ip=ip)
            return JSONResponse(
                status_code=429,
                content={"error": {"code": "BUDGET_EXCEEDED", "message": "当前预算已超限，请稍后再试"}},
            )
        if cost_tracker.is_global_over_budget():
            logger.warning("circuit_breaker_global_budget_exceeded")
            return JSONResponse(
                status_code=429,
                content={"error": {"code": "BUDGET_EXCEEDED", "message": "服务当前负载较高，请稍后再试"}},
            )

        return await call_next(request)
