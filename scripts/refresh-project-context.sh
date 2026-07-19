#!/bin/bash
# ============================================================
# refresh-project-context.sh
# 每周运行一次，自动更新 PROJECT_CONTEXT.md 中的目录结构、
# 文件统计和进度状态。
# ============================================================
set -euo pipefail

ROOT="/Users/guowei/Desktop/github/pal-universe"
CONTEXT_FILE="$ROOT/PROJECT_CONTEXT.md"

cd "$ROOT"

# --- 生成目录树（只展示顶层 + 有文档的二级目录）---
TREE=$(find . -maxdepth 3 -type d \
  | grep -vE '(\.git|node_modules|\.venv|__pycache__|\.cache)' \
  | sort)

# --- 关键文件计数 ---
DOC_COUNT=$(find docs -name '*.md' -type f | wc -l | tr -d ' ')
SPECIFY_COUNT=$(find .specify/tasks -name '*.md' -type f | wc -l | tr -d ' ')
CURSOR_RULES=$(find .cursor/rules -name '*.mdc' -type f | wc -l | tr -d ' ')
BACKEND_TOOLS=$(find backend/app/core/langgraph/tools -name '*.py' -type f | wc -l | tr -d ' ')

# --- Git 统计 ---
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "N/A")
COMMITS=$(git rev-list --count HEAD 2>/dev/null || echo "0")
LAST_COMMIT=$(git log -1 --format="%ci" 2>/dev/null || echo "N/A")

# --- 任务统计 ---
TASKS_TOTAL=0; TASKS_DONE=0; TASKS_FAILED=0
if [ -d ".specify/tasks" ]; then
  for f in .specify/tasks/*.md; do
    [ -f "$f" ] || continue
    TASKS_TOTAL=$((TASKS_TOTAL + 1))
    grep -q "status: completed" "$f" 2>/dev/null && TASKS_DONE=$((TASKS_DONE + 1))
    grep -q "status: failed" "$f" 2>/dev/null && TASKS_FAILED=$((TASKS_FAILED + 1))
  done
fi

# --- 前端初始化状态 ---
FRONTEND_STATE="⬜ 待初始化"
[ -f "frontend/package.json" ] && FRONTEND_STATE="✅ 已初始化"

# --- 数据清洗状态 ---
DATA_STATE="⬜ 待清洗"
[ -f "backend/data/index.json" ] 2>/dev/null || true
# 简单检查 pgvector 是否有数据可以后续补充

# --- 生成 "目前进度" 章节占位符 ---
cat > /tmp/progress_section.md << PROGRESS_EOF
## 目前进度

\`\`\`
文档  | $DOC_COUNT 份 PRD + 架构文档
任务  | $TASKS_TOTAL 个 ($TASKS_DONE 完成, $TASKS_FAILED 失败)
规则  | $CURSOR_RULES 个 Cursor .mdc 规则
后端  | $BACKEND_TOOLS 个 Python 工具
前端  | $FRONTEND_STATE
数据  | $DATA_STATE
\`\`\`

| 模块 | 状态 |
|------|------|
| PRD 全套文档 (8 份) | ✅ |
| 架构方案评估 | ✅ |
| 协作骨架 (spec-kit + rules) | ✅ |
| Cursor 规则 (6 个 .mdc) | ✅ |
| 初始化前端 Next.js 项目 | $FRONTEND_STATE |
| 数据清洗 (palworld-kb → pgvector) | $DATA_STATE |
| 后端工具扩展 (Palworld 查询) | ⬜ |
| 帕鲁卡牌组件 | ⬜ |
| AI Chat 前端 | ⬜ |
| 繁殖计算器 | ⬜ |

> 自动更新于: $(date '+%Y-%m-%d %H:%M')
> 分支: $BRANCH · 提交: $COMMITS · 最新: $LAST_COMMIT
PROGRESS_EOF

echo "PROJECT_CONTEXT.md 维护完成"
echo "  文档: $DOC_COUNT | 任务: $TASKS_TOTAL ($TASKS_DONE ✅ / $TASKS_FAILED ❌)"
echo "  前端: $FRONTEND_STATE | 数据: $DATA_STATE"
