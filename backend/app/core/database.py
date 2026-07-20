"""Database connection and query utilities for API endpoints."""

import os
from typing import Any

import psycopg2
import psycopg2.extras
from psycopg2.pool import ThreadedConnectionPool

# Connection pool (lazy init)
_pool: ThreadedConnectionPool | None = None


def _get_dsn() -> str:
    """Build DSN from environment or defaults matching pal-universe."""
    host = os.getenv("POSTGRES_HOST", "localhost")
    port = os.getenv("POSTGRES_PORT", "5432")
    dbname = os.getenv("POSTGRES_DB", "paluniverse")
    user = os.getenv("POSTGRES_USER", "paluniverse")
    password = os.getenv("POSTGRES_PASSWORD", "paluniverse_dev")
    return f"host={host} port={port} dbname={dbname} user={user} password={password}"


def get_pool() -> ThreadedConnectionPool:
    """Get or initialize the connection pool."""
    global _pool
    if _pool is None:
        _pool = ThreadedConnectionPool(
            minconn=2,
            maxconn=10,
            dsn=_get_dsn(),
        )
    return _pool


def query(sql: str, params: tuple[Any, ...] | list[Any] = ()) -> list[dict[str, Any]]:
    """Execute a read-only query and return results as dicts."""
    pool = get_pool()
    conn = pool.getconn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql, params)
            return [dict(r) for r in cur.fetchall()]
    finally:
        pool.putconn(conn)


def query_one(sql: str, params: tuple[Any, ...] | list[Any] = ()) -> dict[str, Any] | None:
    """Execute a read-only query and return a single result or None."""
    rows = query(sql, params)
    return rows[0] if rows else None
