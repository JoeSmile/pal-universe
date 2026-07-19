.POSIX:
.PHONY: dev dev-backend dev-frontend mock-data db-stop db-logs db-reset lint type-check build help

# ─── 开发 ───────────────────────────────────────────

dev: dev-backend dev-frontend  ## 启动全部服务（后端DB+API + 前端）

dev-backend:  ## 启动后端数据库 + API
	cd backend && docker compose up db -d
	@echo "⏳ 等待数据库就绪..."
	@sleep 3
	@echo "✅ 数据库: paluniverse-db (localhost:5432)"

dev-frontend:  ## 启动前端开发服务器
	cd frontend && bun run dev

mock-data:  ## 生成前端 Mock 数据（从 pgvector 导出 JSON）
	python3 scripts/generate_mock_data.py

# ─── 数据 ───────────────────────────────────────────

seed:  ## 导入数据到 pgvector
	python3 scripts/seed_palworld_data.py --db

validate:  ## 验证数据完整性
	python3 scripts/validate_data.py

images:  ## 下载帕鲁图片（不 commit 到 git，部署时自动拉取）
	python3 scripts/download_images.py

# ─── 数据库管理 ────────────────────────────────────

db-stop:  ## 停止数据库
	cd backend && docker compose stop db

db-logs:  ## 查看数据库日志
	cd backend && docker compose logs db --tail=50 -f

db-reset:  ## 重建数据库（清空所有数据）
	@echo "⚠️  这将清空所有数据！"
	cd backend && docker compose down && docker compose up db -d
	@sleep 5
	python3 scripts/seed_palworld_data.py --db
	python3 scripts/generate_mock_data.py

# ─── 质量门禁 ──────────────────────────────────────

lint:  ## 代码规范检查
	cd frontend && bun run lint

type-check:  ## TypeScript 类型检查
	cd frontend && bun run type-check

test:  ## 运行测试
	cd frontend && bun run test

build:  ## 前端构建
	cd frontend && bun run build

semgrep:  ## 自定义安全扫描
	@command -v semgrep >/dev/null 2>&1 || (echo "安装 Semgrep: pip install semgrep" && exit 1)
	semgrep --config=.semgrep/rules/ --severity=ERROR frontend/src/ backend/

knip:  ## 死代码检测
	cd frontend && bunx knip --no-gitignore

ac-gate:  ## SDD Task AC 完整性检查
	bash scripts/check-ac-gate.sh

lighthouse-ci:  ## 本地性能审计
	@echo "Lighthouse CI 在 GitHub Actions 中运行"
	@echo "本地运行: npx lighthouse http://localhost:3000 --view"

check: lint type-check validate build  ## 全量质量检查（基础）

check-all: check ac-gate semgrep knip  ## 全量质量检查（含门禁）

gate: ac-gate semgrep  ## 门禁专用（AC 完整性 + 安全扫描）

# ─── 任务管理 ─────────────────────────────────────

tasks:  ## 查看任务状态
	bash scripts/sync-tasks.sh status

# ─── 帮助 ──────────────────────────────────────────

help:  ## 显示帮助
	@echo "Pal Universe 开发命令"
	@echo "──────────────────────────────"
	@echo "  make dev          启动全部服务"
	@echo "  make dev-frontend 仅启动前端"
	@echo "  make dev-backend  仅启后后端数据库"
	@echo "  make seed         导入数据到 pgvector"
	@echo "  make mock-data    生成前端 Mock JSON"
	@echo "  make images       下载帕鲁图片"
	@echo "  make validate     验证数据完整性"
	@echo "  make check        全量质量检查（基础）"
	@echo "  make check-all    全量质量检查（含门禁）"
	@echo "  make gate         门禁专用（AC 完整性 + 安全扫描）"
	@echo "  make ac-gate      SDD Task AC 完整性检查"
	@echo "  make semgrep      自定义安全扫描"
	@echo "  make knip         死代码检测"
	@echo "  make test         运行测试"
	@echo "  make build        前端构建"
	@echo "  make db-reset     重建数据库"
	@echo "  make tasks        查看任务状态"
	@echo "  make help         显示本帮助"
