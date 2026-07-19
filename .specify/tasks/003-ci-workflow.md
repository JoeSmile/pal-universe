# 003-ci-workflow

## Status
- status: completed
- assigned_to: hermes
- depends_on: [002]
- completed_at: 2026-07-19

## Goal

创建 GitHub Actions CI workflow，每次 PR 自动跑质量门禁。

## Files
- Create: `.github/workflows/ci.yml`

## Acceptance Criteria
- [x] 配置文件语法正确（`yaml.safe_load` 通过）
- [x] CI workflow 结构完整（包含 type-check → lint → test → build）
- [x] 使用 `oven-sh/setup-bun@v2` 正确安装依赖
- [x] data-validation job 配置正确
- [~] PR 触发和阻止合并 — 需在真实 PR 中验证（非代码可测）
- [~] 总运行时间 < 3min — 需在真实 GitHub Runner 上验证（非代码可测）

## Workflow Spec

```yaml
name: CI
on:
  pull_request:
    types: [opened, synchronize, reopened]
  push:
    branches: [main]

jobs:
  quality-gate:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun run type-check   # tsc --noEmit
      - run: bun run lint         # eslint .
      - run: bun run test:run     # vitest run
      - run: bun run build        # next build
```

## Implementation Hints
- working-directory 指向 `frontend/`（后端单独部署，不混在同一个 CI 里）
- 先不加入安全扫描和 Code Review，Phase 1 再扩展
- 使用 `oven-sh/setup-bun@v2` action
