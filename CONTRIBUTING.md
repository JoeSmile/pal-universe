# Pal Universe — 贡献指南

> 欢迎！无论你是人类开发者还是 AI Agent，请在参与项目前阅读本指南。
> 本文档是项目协作的单一入口，指向所有详细规范文件。

---

## 快速开始

```bash
# 1. 克隆项目
git clone git@github.com:JoeSmile/pal-universe.git
cd pal-universe

# 2. 前端 (Bun)
cd frontend && bun install && bun run dev

# 3. 后端 (Docker)
cd backend && docker compose up db app -d
```

---

## 谁做什么

| 角色 | 职责 | 说明 |
|------|------|------|
| **人** | 需求确认、PR Review、Merge | 最终决策者 |
| **Hermes** | 文档/PRD、任务拆分、CI/CD、Code Review、数据脚本 | 只写 `.specify/` 和 `scripts/` |
| **Cursor** | 组件编码、交互实现、样式、测试 | 只处理 `.specify/tasks/` 中的任务 |

---

## 核心文件索引

你**必须**先读这些文件（按优先级排序）：

| 文件 | 谁用 | 内容 |
|------|------|------|
| `PROJECT_CONTEXT.md` | 所有 Agent | 项目全景——结构、技术栈、进度 |
| `.specify/constitution.md` | 所有 Agent | 技术约束、代码规范、质量门禁 |
| `AGENTS.md` | Hermes + Cursor | 协作工作流、快速命令 |
| `.specify/spec.md` | 所有 Agent | 功能规格——要构建什么 |
| `.specify/plan.md` | 所有 Agent | 技术方案——怎么构建 |
| `backend/AGENTS.md` | 后端工具 | Python 编码规范（structlog/tenacity/async） |

**规范文件的优先级**（冲突时）：
1. `.specify/constitution.md`（项目宪章，不可违背）
2. `CONTRIBUTING.md`（本文档）
3. `.cursor/rules/*.mdc`（Cursor 细则）
4. `backend/AGENTS.md`（后端细则）

---

## 工作流

### 日常开发

```
1. 需求 → 写入 .specify/tasks/{id}-{name}.md (Hermes)
2. 实现 → 读取任务 → 写代码 → git commit (Cursor)
3. 验证 → 检查质量门禁 → 进入下一任务 (Hermes)
4. 全部完成 → 创建 PR (Hermes)
5. 合并 → Review → Merge (人)
```

### Git 分支

- `main` — 生产分支，保护（需 PR + Review）
- 功能开发：直接从 main 创建分支
- 分支命名：`feat/{task-id}-{description}`、`fix/{task-id}-{description}`

### 提交信息

必须使用 Conventional Commits：

```
feat: 新功能
fix: 修复
docs: 文档
refactor: 重构
test: 测试
chore: 构建/工具
data: 数据更新
```

示例：`feat: 添加帕鲁卡牌悬停动画`

### PR 流程

1. 创建 PR 到 main
2. GitHub Actions CI 自动运行（type-check → lint → test → build → 数据验证）
3. CI 通过后，人 Review
4. Squash merge 到 main

---

## 代码规范速查

### TypeScript / React

| 规则 | 标准 |
|------|------|
| 类型检查 | strict 模式 + `noUncheckedIndexedAccess: true` |
| 组件默认 | Server Component（需要交互才加 `"use client"`） |
| Props 命名 | `interface XxxProps`（不要用 type） |
| 文件名 | `kebab-case.tsx` |
| 组件名 | `PascalCase` |
| 函数/变量 | `camelCase` |
| 样式 | Tailwind v4 + Radix UI，不写裸 CSS |

### Python / FastAPI

参照 `backend/AGENTS.md`：
- `structlog` 结构化日志，事件名 `lowercase_with_underscores`
- `tenacity` 重试
- 所有路由加 rate limiting
- 所有 LLM 调用加 Langfuse 追踪
- 所有数据库操作用 async

### 质量门禁

每次提交前必须通过：

```bash
# 前端
cd frontend && bun run type-check && bun run lint && bun run build

# 数据
python3 scripts/validate_data.py
```

---

## Bug 报告

见 `.github/ISSUE_TEMPLATE/bug-report.md`

## 功能需求

见 `.github/ISSUE_TEMPLATE/feature-request.md`

---

## 许可证

MIT — 详见 [LICENSE](backend/LICENSE)
