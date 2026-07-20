.POSIX:
.PHONY: dev dev-db seed mock-data images validate lint type-check test build help

# ⚠️ 前端开发标准方式: cd frontend && bun run dev
# ⚠️ 后端开发标准方式: cd backend && .venv/bin/uvicorn app.main:app --reload
# make 命令只是快捷方式，不是强制入口

# ─── 开发 ─────────────────────────────────────────────

dev: dev-db  ## 启动全部服务（数据库 + 后端 API + 前端）
	@echo "📦 启动后端 API (后台)..."
	cd backend && .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 &
	@sleep 8
	@echo "📦 启动前端 Next.js..."
	cd frontend && bun run dev

dev-db:  ## 启动 PostgreSQL + pgvector
	cd backend && docker compose up db -d
	@echo "⏳ 等待数据库就绪..."
	@sleep 3
	@echo "✅ 数据库: paluniverse-db (localhost:5432)"

seed:  ## 导入数据到 pgvector
	python3 scripts/seed_palworld_data.py --db

mock-data:  ## 生成前端 Mock 数据（从 pgvector 导出 JSON）
	python3 scripts/generate_mock_data.py

images:  ## 下载帕鲁图片（不 commit 到 git，部署时自动拉取）
	python3 scripts/download_images.py

process-spawns:  ## 处理位置数据
	python3 scripts/process_spawns.py

validate:  ## 验证数据完整性
	python3 scripts/validate_data.py

# ─── 质量门禁 ─────────────────────────────────────────

lint:  ## 代码规范检查
	cd frontend && bun run lint

type-check:  ## TypeScript 类型检查
	cd frontend && bun run type-check

test:  ## 运行测试
	cd frontend && bun run test

build:  ## 前端构建
	cd frontend && bun run build

check: lint type-check validate build  ## 全量质量检查（基础）
check-all: check ac-gate semgrep knip  ## 全量质量检查（含门禁）
gate: ac-gate semgrep  ## 门禁专用

# ─── 门禁 ─────────────────────────────────────────────

semgrep:
	@command -v semgrep >/dev/null 2>&1 || (echo "安装 Semgrep: pip install semgrep" && exit 1)
	semgrep --config=.semgrep/rules/ --severity=ERROR frontend/src/ backend/

knip:
	cd frontend && bunx knip --no-gitignore

ac-gate:
	bash scripts/check-ac-gate.sh

# ─── 数据库管理 ──────────────────────────────────────

db-stop:
	cd backend && docker compose stop db

db-logs:
	cd backend && docker compose logs db --tail=50 -f

db-reset:
	@echo "⚠️  清空所有数据！"
	cd backend && docker compose down && docker compose up db -d
	@sleep 5
	python3 scripts/seed_palworld_data.py --db
	python3 scripts/generate_mock_data.py

# ─── 任务管理 ─────────────────────────────────────────

tasks:
	bash scripts/sync-tasks.sh status

# ─── 帮助 ─────────────────────────────────────────────

help:
	@echo "Pal Universe 开发命令"
	@echo "──────────────────────────────"
	@echo ""
	@echo "  🔧 启动服务"
	@echo "    make dev         启动全部（数据库 + 后端 API + 前端）"
	@echo "    make dev-db      仅启动数据库"
	@echo ""
	@echo "  🖥️  手动启动（推荐）"
	@echo "    cd frontend && bun run dev"
	@echo "    cd backend && .venv/bin/uvicorn app.main:app --reload"
	@echo ""
	@echo "  📦 数据"
	@echo "    make seed          导入数据到 pgvector"
	@echo "    make mock-data     生成前端 Mock JSON"
	@echo "    make images        下载帕鲁图片"
	@echo "    make validate      验证数据完整性"
	@echo ""
	@echo "  🧪 质量"
	@echo "    make check         全量检查"
	@echo "    make test          运行测试"
	@echo "    make build         前端构建"
	@echo ""
	@echo "  🗄️  数据库"
	@echo "    make db-reset      重建数据库"
	@echo "    make db-logs       查看日志"
	@echo ""
	@echo "  📋 任务"
	@echo "    make tasks         查看任务状态"
	@echo "    make help          显示本帮助"
