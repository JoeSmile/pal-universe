"""Cost tracking for LLM API usage.

Tracks token consumption per IP and globally.
Supports Valkey (production) and in-memory (development) backends.
"""

import os
import time
from collections import defaultdict

from app.core.logging import logger

# Budget limits (configurable via env)
_IP_DAILY_TOKEN_LIMIT = int(os.getenv("IP_DAILY_TOKEN_LIMIT", "50000"))
_GLOBAL_DAILY_TOKEN_LIMIT = int(os.getenv("GLOBAL_DAILY_TOKEN_LIMIT", "500000"))
_MONTHLY_COST_LIMIT_USD = float(os.getenv("MONTHLY_COST_LIMIT_USD", "50"))


class CostTracker:
    """In-memory cost tracker (fallback when Valkey unavailable).

    Production uses Valkey for persistence across restarts.
    """

    def __init__(self):
        """Initialize in-memory token counters per IP and globally."""
        self._ip_tokens: dict[str, list[tuple[float, int]]] = defaultdict(list)
        self._global_tokens: list[tuple[float, int]] = []

    def record(self, ip: str, tokens: int):
        """Record token usage for an IP."""
        now = time.time()
        self._ip_tokens[ip].append((now, tokens))
        self._global_tokens.append((now, tokens))
        logger.debug("cost_recorded", ip=ip, tokens=tokens)

    def ip_daily_total(self, ip: str) -> int:
        """Total tokens used by an IP in the last 24 hours."""
        cutoff = time.time() - 86400
        return sum(t for ts, t in self._ip_tokens.get(ip, []) if ts > cutoff)

    def global_daily_total(self) -> int:
        """Total tokens used globally in the last 24 hours."""
        cutoff = time.time() - 86400
        return sum(t for ts, t in self._global_tokens if ts > cutoff)

    def is_ip_over_budget(self, ip: str) -> bool:
        """Check if an IP has exceeded its daily budget."""
        return self.ip_daily_total(ip) > _IP_DAILY_TOKEN_LIMIT

    def is_global_over_budget(self) -> bool:
        """Check if global daily budget has been exceeded."""
        return self.global_daily_total() > _GLOBAL_DAILY_TOKEN_LIMIT

    def summary(self) -> dict:
        """Return a summary of current usage."""
        return {
            "ip_limit": _IP_DAILY_TOKEN_LIMIT,
            "global_limit": _GLOBAL_DAILY_TOKEN_LIMIT,
            "monthly_cost_limit_usd": _MONTHLY_COST_LIMIT_USD,
            "active_ips": len(self._ip_tokens),
        }


# Global singleton
cost_tracker = CostTracker()
