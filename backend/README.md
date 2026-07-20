# Pal Universe Backend

Palworld (幻兽帕鲁) super encyclopedia backend with an AI chat assistant — search pals, calculate breeding combos, and chat with an AI agent about everything Palworld.

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Framework** | FastAPI (async) |
| **AI Agent** | LangGraph (stateful, multi-step workflows) |
| **Database** | PostgreSQL 16 + pgvector |
| **ORM** | SQLModel (SQLAlchemy + Pydantic) |
| **Caching** | Valkey / Redis |
| **LLM Provider** | DeepSeek / Qwen / OpenAI (via `langchain_openai.ChatOpenAI`) |
| **LLM Tracing** | Langfuse |
| **Auth** | JWT (session-based) |
| **Logging** | structlog |
| **Monitoring** | Prometheus + Grafana |
| **Rate Limiting** | slowapi |
| **Package Manager** | uv |
| **Python** | 3.13+ |

## Local Development

### Prerequisites

- Python 3.13+
- [uv](https://docs.astral.sh/uv/) (package manager)
- Docker (for PostgreSQL)

### Quick Start

```bash
# 1. Clone and enter the backend directory
cd backend

# 2. Configure environment
cp .env.example .env.development
# Edit .env.development with your API keys (LLM, JWT secret, etc.)

# 3. Install dependencies
make install

# 4. Start PostgreSQL + API
make docker-up

# 5. Run database migrations
make migrate

# 6. Open the API docs
# Visit http://localhost:8000/docs
```

> For local-only development (without Docker), ensure PostgreSQL 16 with pgvector is running locally and update `POSTGRES_HOST=localhost` in `.env.development`, then run `make dev`.

### Available Make Commands

```bash
make dev          # Dev server with hot reload (port 8000)
make lint         # Ruff lint check
make format       # Ruff format
make typecheck    # Pyright static type check
make check        # lint + typecheck
make migrate      # Run DB migrations
make eval         # Run LLM evaluations
make docker-up    # Start API + PostgreSQL containers
make stack-up     # Full stack: API + DB + Prometheus + Grafana
```

## Environment Variables

Key configuration in `.env.development`:

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_ENV` | `development` | Environment name |
| `PROJECT_NAME` | `"Web Assistant"` | Application name (displayed in API docs) |
| `API_V1_STR` | `/api/v1` | API version prefix |
| `ALLOWED_ORIGINS` | `http://localhost:3000,http://localhost:8000` | CORS origins |
| `DEBUG` | `true` | Enable debug mode (profiling, verbose logs) |
| `OPENAI_API_KEY` | — | LLM API key (DeepSeek, Qwen, or OpenAI) |
| `DEFAULT_LLM_MODEL` | `gpt-5-mini` | Default LLM model for chat |
| `DEFAULT_LLM_TEMPERATURE` | `0.2` | LLM temperature |
| `JWT_SECRET_KEY` | — | Secret key for JWT signing |
| `JWT_ACCESS_TOKEN_EXPIRE_DAYS` | `30` | JWT token expiry |
| `POSTGRES_HOST` | `db` | PostgreSQL host |
| `POSTGRES_DB` | `mydb` | Database name |
| `POSTGRES_USER` | `myuser` | Database user |
| `POSTGRES_PASSWORD` | — | Database password |
| `LANGFUSE_TRACING_ENABLED` | `false` | Enable Langfuse tracing |
| `LANGFUSE_PUBLIC_KEY` | — | Langfuse public key |
| `LANGFUSE_SECRET_KEY` | — | Langfuse secret key |
| `VALKEY_HOST` | _(empty)_ | Valkey/Redis host (leave empty to disable caching) |
| `CACHE_TTL_SECONDS` | `60` | Default cache TTL |
| `RATE_LIMIT_DEFAULT` | `1000 per day,200 per hour` | Default rate limit |
| `LOG_LEVEL` | `DEBUG` | Logging level |
| `LOG_FORMAT` | `console` | Log format: `json` or `console` |

## API Endpoints

All endpoints are prefixed with `/api/v1`.

### Auth
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Login, returns JWT token |
| `POST` | `/auth/logout` | Logout (invalidate session) |
| `GET` | `/auth/sessions` | List active sessions |
| `DELETE` | `/auth/sessions/{id}` | Revoke a session |

### Pals
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/pals` | List/search pals (query params: `name`, `type`, `rank`, `limit`, `offset`) |
| `GET` | `/pals/{pal_name}` | Get pal detail by name |

### Breeding
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/breeding/calculate` | Calculate offspring from two parent pal names |
| `GET` | `/breeding/combos` | List all special breeding combos |

### Chat
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/chatbot/chat` | Send a chat message (non-streaming) |
| `POST` | `/chatbot/chat/stream` | Send a chat message (SSE streaming response) |
| `GET` | `/chatbot/messages` | Get message history for a session |
| `DELETE` | `/chatbot/messages` | Clear message history |

### Health
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check (includes DB status) |

## Project Structure

```
backend/
├── app/
│   ├── api/v1/              # Route handlers
│   ├── core/                # Config, middleware, logging, agent graph
│   ├── models/              # SQLModel ORM models
│   ├── schemas/             # Pydantic schemas
│   ├── services/            # Business logic services
│   └── utils/               # Shared utilities
├── alembic/                 # Database migrations
├── evals/                   # LLM evaluation framework
└── scripts/                 # Setup and build scripts
```

## License

See [LICENSE](LICENSE).
