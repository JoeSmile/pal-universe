"""Cost tracking and rate limiting for LLM API usage.

Tracks token consumption and request counts in Redis.
Supports IP-only (anonymous) and IP+user (authenticated) dimensions.
"""

import os
import time
from collections import defaultdict

from redis import Redis
from redis.exceptions import RedisError

from app.core.config import settings
from app.core.logging import logger

# Limits
_IP_DAILY_TOKEN_LIMIT = int(os.getenv("IP_DAILY_TOKEN_LIMIT", "50000"))
_GLOBAL_DAILY_TOKEN_LIMIT = int(os.getenv("GLOBAL_DAILY_TOKEN_LIMIT", "500000"))
_ANON_CHAT_LIMIT = int(os.getenv("ANON_CHAT_LIMIT", "5"))
_USER_CHAT_LIMIT = int(os.getenv("USER_CHAT_LIMIT", "50"))
_IP_REGISTER_LIMIT = int(os.getenv("IP_REGISTER_LIMIT", "3"))
_SUSPICIOUS_SWITCH_LIMIT = int(os.getenv("SUSPICIOUS_SWITCH_LIMIT", "3"))
_SUSPICIOUS_WINDOW_SEC = int(os.getenv("SUSPICIOUS_WINDOW_SEC", "300"))  # 5 min


class RateLimitExceeded(Exception):
    def __init__(self, code: str, message: str, retry_after: int = 0):
        self.code = code
        self.message = message
        self.retry_after = retry_after
        super().__init__(message)


class CostTracker:
    """In-memory cost tracker with Redis-backed rate limiting."""

    def __init__(self):
        self._ip_tokens: dict[str, list[tuple[float, int]]] = defaultdict(list)
        self._global_tokens: list[tuple[float, int]] = []
        self._redis = None

    def _r(self) -> Redis | None:
        if self._redis is None:
            try:
                self._redis = Redis(
                    host=settings.VALKEY_HOST,
                    port=settings.VALKEY_PORT,
                    db=settings.VALKEY_DB,
                    decode_responses=True,
                )
                self._redis.ping()
            except RedisError:
                self._redis = False
                return None
        return self._redis if isinstance(self._redis, Redis) else None

    def record(self, ip: str, tokens: int):
        now = time.time()
        self._ip_tokens[ip].append((now, tokens))
        self._global_tokens.append((now, tokens))

    def ip_daily_total(self, ip: str) -> int:
        cutoff = time.time() - 86400
        return sum(t for ts, t in self._ip_tokens.get(ip, []) if ts > cutoff)

    def global_daily_total(self) -> int:
        cutoff = time.time() - 86400
        return sum(t for ts, t in self._global_tokens if ts > cutoff)

    def is_ip_over_budget(self, ip: str) -> bool:
        return self.ip_daily_total(ip) > _IP_DAILY_TOKEN_LIMIT

    def is_global_over_budget(self) -> bool:
        return self.global_daily_total() > _GLOBAL_DAILY_TOKEN_LIMIT

    # ─── Rate limits (Redis-backed) ─────────────────────────

    def _redis_incr(self, key: str, ttl: int) -> int:
        """Increment a Redis counter and return current value."""
        r = self._r()
        if not r:
            return 0  # Redis unavailable — skip rate limiting
        try:
            val = r.incr(key)
            if val == 1:
                r.expire(key, ttl)
            return val
        except Exception:
            return 0

    def check_chat_rate(self, ip: str, user_id: int | None = None) -> None:
        """Check if this request is within chat rate limits.

        Raises RateLimitExceeded if over limit.
        """
        ip_key = f"rate:chat:ip:{ip}"
        ip_count = self._redis_incr(ip_key, 86400)
        if ip_count == 1:
            pass  # first request today

        if user_id:
            user_key = f"rate:chat:user:{user_id}"
            user_count = self._redis_incr(user_key, 86400)
            if user_count > _USER_CHAT_LIMIT:
                raise RateLimitExceeded(
                    "USER_DAILY_LIMIT",
                    f"今日对话已达上限 ({_USER_CHAT_LIMIT})，明日重置",
                )

        # IP全局限制（无论是否登录）
        if ip_count > _USER_CHAT_LIMIT:
            raise RateLimitExceeded(
                "IP_DAILY_LIMIT",
                f"当前 IP 今日对话已达上限 ({_USER_CHAT_LIMIT})",
            )

        # 匿名用户更严格的限制
        if not user_id and ip_count > _ANON_CHAT_LIMIT:
            raise RateLimitExceeded(
                "ANON_DAILY_LIMIT",
                f"游客今日对话已达上限 ({_ANON_CHAT_LIMIT})，注册后获得更多额度",
            )

    def check_email_register_rate(self, ip: str) -> None:
        """Check if this IP has exceeded the daily register limit."""
        key = f"rate:register:ip:{ip}"
        count = self._redis_incr(key, 86400)
        if count > _IP_REGISTER_LIMIT:
            raise RateLimitExceeded(
                "REGISTER_IP_LIMIT",
                f"当前 IP 今日注册已达上限 ({_IP_REGISTER_LIMIT})",
            )

    def check_account_switch(self, ip: str, user_id: int) -> None:
        """Detect rapid account switching (IP changes user within window)."""
        switch_key = f"rate:ip:{ip}:account_switch"
        switch_count = self._redis_incr(switch_key, _SUSPICIOUS_WINDOW_SEC)
        if switch_count > _SUSPICIOUS_SWITCH_LIMIT:
            # Flag IP as suspicious
            flag_key = f"flag:suspicious:{ip}"
            r = self._r()
            if r:
                r.setex(flag_key, 604800, "1")  # 7 day TTL
            logger.warning("suspicious_account_switch", ip=ip, user_id=user_id)


cost_tracker = CostTracker()
