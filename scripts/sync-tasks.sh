#!/bin/bash
# ============================================================
# sync-tasks.sh — 任务同步脚本
# 用途: Hermes Agent 调用此脚本来检查 .specify/tasks/ 状态
#       并在任务全部完成后触发提交流程
# 用法:
#   ./scripts/sync-tasks.sh status    ← 查看所有任务状态
#   ./scripts/sync-tasks.sh next      ← 显示下一个可执行任务
#   ./scripts/sync-tasks.sh verify    ← 检查所有完成的任务是否满足 AC
#   ./scripts/sync-tasks.sh pr        ← 全部完成后创建 PR
# ============================================================

set -euo pipefail

TASKS_DIR=".specify/tasks"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

status() {
    echo -e "${BLUE}═══════════════════════════════════${NC}"
    echo -e "${BLUE}  任务状态总览${NC}"
    echo -e "${BLUE}═══════════════════════════════════${NC}"
    echo ""

    total=0
    completed=0
    failed=0
    pending=0
    in_progress=0

    for f in "$TASKS_DIR"/*.md; do
        [ -f "$f" ] || continue
        total=$((total + 1))
        name=$(basename "$f" .md)

        if grep -q "status: completed" "$f" 2>/dev/null; then
            echo -e "  ${GREEN}✅${NC} $name"
            completed=$((completed + 1))
        elif grep -q "status: failed" "$f" 2>/dev/null; then
            echo -e "  ${RED}❌${NC} $name"
            failed=$((failed + 1))
        elif grep -q "status: in_progress" "$f" 2>/dev/null; then
            echo -e "  ${YELLOW}🔄${NC} $name"
            in_progress=$((in_progress + 1))
        else
            echo -e "  ${BLUE}⏳${NC} $name"
            pending=$((pending + 1))
        fi
    done

    echo ""
    echo -e "${BLUE}───────────────────────────────────${NC}"
    echo -e "  总计: $total  |  ${GREEN}完成: $completed${NC}  |  ${RED}失败: $failed${NC}  |  ${YELLOW}进行中: $in_progress${NC}  |  ⏳待处理: $pending"

    if [ $completed -eq $total ] && [ $total -gt 0 ]; then
        echo -e "${GREEN}  🎉 全部任务完成！可以提 PR 了${NC}"
    fi
}

next() {
    echo -e "${BLUE}下一个可执行任务:${NC}"
    echo ""

    # 收集所有 completed 的任务 ID（用于检查依赖）
    completed_ids=$(grep -rl "status: completed" "$TASKS_DIR" 2>/dev/null | xargs -I{} grep -l "id:" {} | xargs -I{} grep "id:" {} | sed 's/.*id: //' || echo "")

    for f in "$TASKS_DIR"/*.md; do
        [ -f "$f" ] || continue
        status_line=$(grep "status:" "$f" | head -1)
        depends_line=$(grep "depends_on:" "$f" | head -1)

        # 只检查 pending 状态
        echo "$status_line" | grep -q "pending" || continue

        # 检查依赖
        deps=$(echo "$depends_line" | sed 's/.*depends_on: //' | tr -d '[]' | tr -d ' ')
        if [ -z "$deps" ] || [ "$deps" = "null" ]; then
            echo -e "  ${GREEN}→${NC} $(basename "$f") — 无依赖，可直接执行"
            echo ""
            head -5 "$f" | grep -E "^## 目标|^# " | sed 's/^# /  标题: /' | sed 's/^## 目标/  目标: /'
            return 0
        fi

        # 检查所有依赖是否已完成
        all_met=true
        for dep in $deps; do
            dep_file="$TASKS_DIR/$dep.md"
            if [ -f "$dep_file" ]; then
                if ! grep -q "status: completed" "$dep_file" 2>/dev/null; then
                    all_met=false
                    break
                fi
            else
                all_met=false
            fi
        done

        if [ "$all_met" = true ]; then
            echo -e "  ${GREEN}→${NC} $(basename "$f") — 依赖已满足"
            head -5 "$f" | grep -E "^## 目标|^# " | sed 's/^# /  标题: /' | sed 's/^## 目标/  目标: /'
            return 0
        fi
    done

    echo "  没有可执行的任务（等待现有任务完成或新任务创建）"
}

verify() {
    echo -e "${BLUE}校验已完成的任务...${NC}"
    echo ""

    all_pass=true

    for f in "$TASKS_DIR"/*.md; do
        [ -f "$f" ] || continue
        grep -q "status: completed" "$f" 2>/dev/null || continue
        name=$(basename "$f" .md)

        # 检查是否有验收标准
        if grep -q "\[ \]" "$f" 2>/dev/null; then
            unchecked=$(grep -c "\[ \]" "$f" 2>/dev/null || echo 0)
            if [ "$unchecked" -gt 0 ]; then
                echo -e "  ${YELLOW}⚠️${NC} $name — 有 $unchecked 个验收标准未勾选"
                all_pass=false
            else
                echo -e "  ${GREEN}✅${NC} $name — 验收标准全部通过"
            fi
        fi
    done

    if [ "$all_pass" = true ]; then
        echo ""
        echo -e "${GREEN}  所有任务验收通过 ✓${NC}"
    fi
}

pr() {
    echo -e "${BLUE}检查是否可以提 PR...${NC}"
    echo ""

    # 检查是否全部完成
    total=0
    completed=0
    for f in "$TASKS_DIR"/*.md; do
        [ -f "$f" ] || continue
        total=$((total + 1))
        if grep -q "status: completed" "$f" 2>/dev/null; then
            completed=$((completed + 1))
        fi
    done

    if [ "$completed" -ne "$total" ]; then
        echo -e "${RED}❌ 还有 $((total - completed)) 个任务未完成，不能提 PR${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ 全部 $total 个任务已完成${NC}"
    echo ""

    # 检查是否有未提交的变更
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${YELLOW}⚠️ 有未提交的变更，先提交再提 PR${NC}"
        echo ""
        git status --short
        exit 1
    fi

    # 检查当前分支
    branch=$(git rev-parse --abbrev-ref HEAD)
    if [ "$branch" = "main" ]; then
        echo -e "${YELLOW}⚠️ 当前在 main 分支，先创建新分支${NC}"
        exit 1
    fi

    # 构建提交信息
    task_list=""
    for f in "$TASKS_DIR"/*.md; do
        [ -f "$f" ] || continue
        title=$(head -1 "$f" | sed 's/^# //')
        task_list="$task_list  - $title\\n"
    done

    # 推送到远程并创建 PR
    echo -e "${GREEN}🚀 推送到远程并创建 PR...${NC}"
    git push origin "$branch"

    # 用 gh CLI 创建 PR（如果有 gh auth）
    if command -v gh &>/dev/null && gh auth status &>/dev/null; then
        gh pr create \
            --title "feat: Pal Universe Phase $(echo $branch | grep -oP '[0-9]+' | head -1)" \
            --body "## 完成的任务\\n\\n$task_list\\n\\n---\\n\\n> 由 Hermes Agent 自动创建" \
            --reviewer guowei
    else
        echo ""
        echo -e "${YELLOW}⚠️ gh CLI 未登录，请手动创建 PR:${NC}"
        echo "  https://github.com/guowei/pal-universe/pull/new/$branch"
    fi
}

# Main
case "${1:-status}" in
    status)
        status
        ;;
    next)
        next
        ;;
    verify)
        verify
        ;;
    pr)
        pr
        ;;
    *)
        echo "用法: $0 {status|next|verify|pr}"
        exit 1
        ;;
esac
