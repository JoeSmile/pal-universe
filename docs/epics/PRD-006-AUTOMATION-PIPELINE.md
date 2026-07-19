# PRD-006: 自动化 Pipeline

> Status: Draft · Author: AI Agent · Updated: 2026-07-19  
> Epic Lead: TBD · Dependencies: PRD-000

---

## 1. 概述

构建"Vibe Coding"自动化飞轮——从需求提报到生产部署的全链路自动化。这是 Pal Universe 的**开发流程操作系统**，让开发效率提升 10x。

## 2. 自动化飞轮全景

```
                           🤖 自动化飞轮
                           
  [用户/社区]
      │
      ▼
  ┌─────────────────────────────────────────────┐
  │  Step 1: 需求                              │
  │  GitHub Issue (feature/bug/refactor)        │
  │  标签: epic/feature/bug/documentation        │
  └───────────────────┬─────────────────────────┘
                      │
  ┌───────────────────▼─────────────────────────┐
  │  Step 2: 需求解析 (AI Agent)                │
  │  Agent 读 Issue → 理解需求                  │
  │  → 生成技术方案 (PRD/Tech Spec)              │
  │  → 发布评论 @用户确认                       │
  └───────────────────┬─────────────────────────┘
                      │ 用户确认 ✓
                      │
  ┌───────────────────▼─────────────────────────┐
  │  Step 3: 编码实现 (AI Agent)                │
  │  Agent 拉取最新代码 → 创建分支               │
  │  → 编写代码 + 测试 → 提交 PR               │
  │  输出: PR 含 代码+测试+更新文档             │
  └───────────────────┬─────────────────────────┘
                      │
  ┌───────────────────▼─────────────────────────┐
  │  Step 4: 质量门禁 (自动)                    │
  │  ├── TypeScript 类型检查 (tsc --noEmit)    │
  │  ├── ESLint 代码规范 + Prettier 格式       │
  │  ├── Vitest 单元测试 (覆盖新代码)          │
  │  ├── AI Code Review (自动化 Review)         │
  │  ├── 安全扫描 (Semgrep + CodeQL)           │
  │  ├── 依赖漏洞扫描 (Dependabot)             │
  │  └── 构建测试 (Build check)                │
  └───────────────────┬─────────────────────────┘
                      │ 全部通过 ✓
                      │
  ┌───────────────────▼─────────────────────────┐
  │  Step 5: 自动部署 Preview                   │
  │  Vercel Preview Deployment                  │
  │  → 自动评论 PR 附带预览链接                  │
  │  → Playwright E2E 测试 (截屏对比)           │
  └───────────────────┬─────────────────────────┘
                      │ 人工 Review + Merge ✓
                      │
  ┌───────────────────▼─────────────────────────┐
  │  Step 6: 生产部署                           │
  │  合并到 main → 自动部署 Vercel Production   │
  │  → 自动创建 Release + Changelog             │
  │  → 通知社区 (Discord/Telegram)              │
  └───────────────────┬─────────────────────────┘
                      │
                      ▼
              🔄 回到 Step 1
```

## 3. GitHub Actions 工作流

### 3.1 工作流清单

```yaml
# 工作流矩阵
workflows:
  - id: ci
    trigger: [pull_request]
    jobs: [type-check, lint, test, build, security-scan, size-limit]
    timeout: 10min

  - id: cd
    trigger: [push: main]
    jobs: [deploy-production, create-release, notify]
    timeout: 15min

  - id: sync-data
    trigger: [schedule: weekly]
    jobs: [check-data-update, create-data-pr]
    timeout: 5min

  - id: security-audit
    trigger: [schedule: daily]
    jobs: [dependency-scan, code-scan]
    timeout: 10min

  - id: auto-review
    trigger: [pull_request: opened]
    jobs: [ai-code-review]
    timeout: 5min

  - id: auto-label
    trigger: [issues: opened, pull_request: opened]
    jobs: [classify-and-label]
    timeout: 1min

  - id: weekly-report
    trigger: [schedule: weekly]
    jobs: [generate-report]
    timeout: 5min
```

### 3.2 关键工作流实现

```yaml
# .github/workflows/ci.yml
name: CI Quality Gate
on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  quality-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      
      - name: Install
        run: bun install --frozen-lockfile
      
      - name: Type Check
        run: bun run type-check
        
      - name: Lint
        run: bun run lint
        
      - name: Unit Tests
        run: bun run test:run --coverage
        
      - name: Build
        run: bun run build
        
      - name: Security Scan
        uses: github/codeql-action/analyze@v3
        
      - name: Size Limit
        run: npx size-limit
        
      - name: AI Code Review
        uses: openai/code-review@v1
        with:
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          
      - name: Auto Approve (if all pass)
        if: success()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.pulls.createReview({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: context.issue.number,
              event: 'APPROVE',
              body: '✅ All quality gates passed. Ready for human review.'
            })
```

### 3.3 数据同步工作流

```yaml
# .github/workflows/sync-data.yml
name: Sync Palworld Data
on:
  schedule:
    - cron: '0 6 * * 1'  # 每周一早上6点
  workflow_dispatch:       # 可手动触发

jobs:
  check-and-sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Check Paldex API Updates
        id: check
        run: |
          # 检查上游数据源是否有新版本
          LATEST=$(curl -s https://api.github.com/repos/mlg404/palworld-paldex-api/releases/latest | jq -r .tag_name)
          CURRENT=$(cat data/VERSION 2>/dev/null || echo "none")
          echo "latest=$LATEST" >> $GITHUB_OUTPUT
          echo "current=$CURRENT" >> $GITHUB_OUTPUT
      
      - name: Download Updated Data
        if: steps.check.outputs.latest != steps.check.outputs.current
        run: |
          bun run scripts/sync-data.ts
          echo ${{ steps.check.outputs.latest }} > data/VERSION
      
      - name: Create Data Update PR
        if: steps.check.outputs.latest != steps.check.outputs.current
        uses: peter-evans/create-pull-request@v6
        with:
          title: "🤖 自动数据同步: v${{ steps.check.outputs.latest }}"
          body: |
            ## 自动数据更新
            
            - 源仓库: mlg404/palworld-paldex-api
            - 版本: ${{ steps.check.outputs.latest }} (之前: ${{ steps.check.outputs.current }})
            - 更新内容: 帕鲁数据/繁殖组合/图片
            
            > 此 PR 由自动化工作流自动创建
          branch: auto/sync-data-${{ steps.check.outputs.latest }}
```

## 4. AI Code Review 规范

### 4.1 审查维度

| 维度 | 检查项 | 通过条件 |
|------|--------|---------|
| 正确性 | 代码逻辑是否正确 | 无逻辑错误 |
| 性能 | 有无性能问题 (O(n²)/重复渲染) | 无重大问题 |
| 安全 | 有无 XSS/SQL 注入/敏感信息泄露 | 零容忍 |
| 可维护性 | 命名/结构/注释是否清晰 | 符合项目规范 |
| 测试覆盖 | 新代码是否有对应测试 | 覆盖率 > 80% |
| 类型安全 | TypeScript 类型是否正确 | strict 模式通过 |

### 4.2 Review 输出格式

```markdown
## 🤖 AI Code Review Report

### ✅ 通过的检查
- [x] TypeScript 类型检查
- [x] ESLint 规范
- [x] 单元测试

### ⚠️ 建议改进
1. **性能**: src/components/PalCard.tsx:42 — useEffect 缺少依赖数组
   ```suggestion
   useEffect(() => {
     fetchPalData(pal.id)
   }, [pal.id])  // 建议添加依赖
   ```

2. **可读性**: src/lib/breeding.ts:88 — 函数超过 50 行，建议拆分

### ❌ 阻止合并
（无）
```

## 5. 验收标准

| ID | 标准 | 测试方式 |
|----|------|---------|
| AC-001 | 提交 PR 后 3min 内完成全部质量门禁 | 实际测试 |
| AC-002 | 数据同步工作流自动检测数据变更 | 模拟测试 |
| AC-003 | AI Code Review 能发现 90% 以上的常见问题 | 已知样本测试 |
| AC-004 | 合并到 main 后 5min 内自动部署到生产 | 实际测试 |
| AC-005 | 每周自动生成开发报告 | 检查生成结果 |
| AC-006 | 安全扫描发现 CVE 后自动创建 Issue | 模拟测试 |

## 6. 自动化脚本清单

| 脚本 | 位置 | 功能 | 触发方式 |
|------|------|------|---------|
| sync-data.ts | scripts/ | 从 GitHub 同步 JSON + 图片 | 定时/手动 |
| build-knowledge.ts | scripts/ | 构建 RAG 知识库 | 数据更新后 |
| validate-data.ts | scripts/ | 校验 JSON 数据结构完整 | 每次数据更新 |
| generate-sitemap.ts | scripts/ | 生成 sitemap.xml | Build 时 |
| check-game-update.ts | scripts/ | 检测游戏版本更新 | 定时 |
| auto-changelog.ts | scripts/ | 从 commits 生成 changelog | Release 时 |
| weekly-report.ts | scripts/ | 生成周报 (PR/Sprint/数据) | 每周 |
