#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────
# SDD Task AC 门禁 — 验收标准完整性检查
# 检查 .specify/tasks/ 下所有已完成任务的验收标准是否全部勾选
# ─────────────────────────────────────────────────────────
set -euo pipefail

TASKS_DIR=".specify/tasks"
ERRORS=0
WARNINGS=0

echo "🔍 SDD Task AC 门禁检查"
echo "═══════════════════════════"

if [ ! -d "$TASKS_DIR" ]; then
  echo "❌ 未找到任务目录: $TASKS_DIR"
  exit 1
fi

for task_file in "$TASKS_DIR"/*.md; do
  [ -f "$task_file" ] || continue

  task_name=$(basename "$task_file" .md)

  # 提取 status
  status=$(grep -E '^-\s*status:\s*' "$task_file" | sed 's/.*status:\s*//' | tr -d ' ')
  
  # 只有 completed 的任务需要检查
  if [ "$status" != "completed" ]; then
    continue
  fi

  # 提取所有验收标准项（- [ ] 或 - [x] 或 - [~]）
  total_ac=0
  unchecked_ac=0
  deferred_ac=0

  while IFS= read -r line; do
    if [[ "$line" =~ ^-[[:space:]]\[([ x~])\] ]]; then
      total_ac=$((total_ac + 1))
      case "${BASH_REMATCH[1]}" in
        " ") unchecked_ac=$((unchecked_ac + 1)) ;;
        "~") deferred_ac=$((deferred_ac + 1)) ;;
      esac
    fi
  done < <(grep -E '^- \[[ x~]\]' "$task_file" || true)

  if [ "$total_ac" -eq 0 ]; then
    echo "  ⚠️  $task_name — 没有验收标准项，跳过检查"
    WARNINGS=$((WARNINGS + 1))
    continue
  fi

  if [ "$unchecked_ac" -gt 0 ]; then
    echo "  ❌ $task_name — 已完成但还有 $unchecked_ac/$total_ac 验收标准未勾选"
    ERRORS=$((ERRORS + 1))
    # 显示未勾选的项
    grep -E '^- \[ \]' "$task_file" | while IFS= read -r ac; do
      echo "       ☐ $ac"
    done
  elif [ "$deferred_ac" -gt 0 ]; then
    echo "  ⏳ $task_name — 已通过 $((total_ac - deferred_ac))/$total_ac, $deferred_ac 项需环境验证 [~]"
  else
    echo "  ✅ $task_name — 全部 $total_ac 项验收标准已通过"
  fi
done

echo ""
echo "═══════════════════════════"
echo "结果: $ERRORS 个错误, $WARNINGS 个警告"

if [ "$ERRORS" -gt 0 ]; then
  echo "❌ AC 门禁未通过 — 请完成所有验收标准后再合并 PR"
  exit 1
else
  echo "✅ AC 门禁通过"
fi
