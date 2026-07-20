"""Audit logging utility for API request tracking.

Records all non-health API requests to rotating log files.
"""

import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

from app.core.logging import logger

# Audit log directory (configurable via env)
_AUDIT_DIR = Path(os.getenv("AUDIT_LOG_DIR", "/tmp/paluniverse-audit"))
_MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB rotation


def _ensure_dir() -> Path:
    _AUDIT_DIR.mkdir(parents=True, exist_ok=True)
    return _AUDIT_DIR


def _today_file() -> Path:
    """Rotate by day: /tmp/paluniverse-audit/2026-07-19.jsonl."""
    date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return _ensure_dir() / f"{date}.jsonl"


def record(
    method: str,
    path: str,
    ip: str,
    user_agent: str | None,
    status: int,
    duration_ms: int,
    tokens_used: int | None = None,
    error_code: str | None = None,
    request_id: str | None = None,
) -> str:
    """Record a single API request to the audit log.

    Returns the request_id for correlation.
    """
    rid = request_id or uuid.uuid4().hex[:12]

    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "request_id": rid,
        "method": method,
        "path": path,
        "ip": ip,
        "user_agent": user_agent,
        "status": status,
        "duration_ms": duration_ms,
        "tokens_used": tokens_used,
        "error_code": error_code,
    }

    # Write to daily-rotated JSONL file
    try:
        with open(_today_file(), "a") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")

        # Rotate if oversized
        file_size = _today_file().stat().st_size
        if file_size > _MAX_FILE_SIZE:
            _rotate(_today_file())
    except Exception as e:
        logger.warning("audit_write_failed", error=str(e))

    # Also emit structured log
    logger.info("api_request", **entry)
    return rid


def _rotate(filepath: Path):
    """Simple rotation: rename current file with timestamp."""
    ts = datetime.now(timezone.utc).strftime("%H%M%S")
    rotated = filepath.with_suffix(f".{ts}.jsonl")
    filepath.rename(rotated)
    logger.info("audit_log_rotated", old=str(filepath.name), new=str(rotated.name))
