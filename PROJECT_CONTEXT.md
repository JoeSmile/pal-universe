# Pal Universe — 项目上下文

> 任何 Agent 进入本项目，请先读这个文件。
> 读完你就知道项目是干什么的、目录怎么组织的、该用什么工具、找谁问什么。

---

## 一句话

Palworld（幻兽帕鲁）的超级百科网站——AI 聊天助手 + TCG 卡牌 UI + 繁殖可视化 + 互动地图。

## 目录结构

```
pal-universe/
│
├── .specify/                     ← 📋 共享契约 (spec-kit 格式)
│   ├── constitution.md           ← 项目宪章 (行为准则)
│   ├── spec.md                   ← 功能规格 (要做什么)
│   ├── plan.md                   ← 技术方案 (怎么做)
│   └── tasks/                    ← 🎯 任务队列
│
├── .github/
│   ├── workflows/
│   │   └── ci.yml                ← 🔄 CI (type-check/lint/test/build + 数据验证)
│   ├── PULL_REQUEST_TEMPLATE.md  ← PR 模板
│   └── ISSUE_TEMPLATE/
│       ├── bug-report.md         ← Bug 报告模板
│       └── feature-request.md    ← 功能需求模板
│
├── .cursor/
│   └── rules/
│       ├── specify-workflow.mdc  ← 我们写的 spec-kit 工作流
│       ├── shadcn-ui.mdc         ← React + shadcn 编码规范
│       ├── nextjs-app-router.mdc ← Next.js App Router 最佳实践
│       ├── fastapi.mdc           ← FastAPI 后端规范
│       ├── clean-code.mdc        ← 代码质量
│       └── git-commit.mdc        ← 提交格式
│
├── docs/                          ← 📚 全部 PRD + 架构文档
│   ├── PRD-000.md                ← 主 PRD (产品全景)
│   ├── design/TOKENS.md          ← 🎨 设计 Token (颜色/字体/间距)
│   ├── epics/                    ← 7 个 Epic 的详细 PRD
│   ├── architecture/             ← 架构方案评估
│   └── decisions/                ← 技术决策记录 (ADR)
│
├── frontend/                      ← 📦 前端项目 (✅ 已初始化 Next.js 15)
│   ├── .env.example              ← 环境变量模板
│   └── src/app/                  ← App Router 骨架
│
├── backend/                       ← ✅ 已有: FastAPI + LangGraph
│   ├── data/VERSION              ← 数据版本标记 (自动生成)
│   └── app/
│       └── core/langgraph/tools/  ← 🎯 需要加 Palworld 工具
│
├── scripts/
│   ├── seed_palworld_data.py     ← 🔄 数据加载 + 验证
│   ├── validate_data.py          ← 🔄 CI 中调用的数据校验
│   └── sync-tasks.sh              ← 🔄 任务调度脚本
│
├── CONTRIBUTING.md                 ← 📖 贡献指南（团队+Agent 入口）
├── AGENTS.md                      ← 协作手册
├── PROJECT_CONTEXT.md             ← ← 你正在看的这个文件
├── README.md                      ← 项目首页
└── .gitignore                     ← Git 忽略规则
```

## 技术栈一览

| 层 | 技术 | 状态 |
|----|------|------|
| 前端框架 | Next.js 15 + React 19 | ✅ 已初始化 |
| 样式 | Tailwind CSS v4 + Radix UI | ✅ 已初始化 |
| 动画 | Framer Motion | ✅ 已安装 |
| 地图 | Leaflet + React-Leaflet | ⬜ 待安装 |
| 后端 API | FastAPI + Uvicorn | ✅ 已有 |
| AI 编排 | LangGraph StateGraph | ✅ 已有 |
| LLM 调用 | LangChain ChatOpenAI (LLMRegistry) | ✅ 已有 |
| 数据库 | PostgreSQL 16 + pgvector | ✅ Docker 镜像 |
| 长期记忆 | mem0 | ✅ 已有 |
| 认证 | JWT | ✅ 已有 |
| 限流 | slowapi | ✅ 已有 |
| 监控 | Langfuse + Prometheus + Grafana | ✅ 已有 |

## 数据源

| 数据 | 位置 | 处理方式 |
|------|------|---------|
| 299 帕鲁 + 繁殖 + 物品 | `scripts/seed_palworld_data.py` | ✅ 加载验证脚本就绪，待入库 pgvector |
| 地图刷怪点 | `~/Desktop/github/palworld-atlas-data/published/` | JSON 静态文件 |
| 帕鲁图片 | mlg404/paldex-api (GitHub) | 直接从 CDN 引用 |

## 协作工作流

```
Hermes: 写需求 → 拆任务 → 写 .specify/tasks/*.md
Cursor: 自动检测任务 → 实现代码 → git commit → 更新任务状态
Hermes: 验证 → 进入下一任务 → 全部完成 → 自动提 PR
人:    Review → Merge ✅
```

Agent 之间不直接通信，通过 `.specify/` 文件系统和 git 提交记录交换信息。

## 目前进度

```
Phase 0 — 基础骨架 ✅
├── ✅ PRD 全套文档 (10 份 + Token)
├── ✅ 架构方案评估 (3 数据源 + 后端复用分析)
├── ✅ 协作骨架 (spec-kit + Cursor rules + sync-tasks.sh)
├── ✅ Cursor 规则 (6 个 .mdc + specify-workflow)
├── ✅ 前端初始化 (Next.js 15 + TypeScript + Tailwind v4)
├── ✅ 数据加载脚本 (seed_palworld_data.py + validate_data.py)
├── ✅ CI workflow (.github/workflows/ci.yml)
├── ✅ 设计 Token (docs/design/TOKENS.md)
├── ✅ Code Review + 修复 (5 个问题已修)
└── ⬜ 推送到 GitHub (待 PR)

Phase 1 — 核心功能
├── ⬜ 帕鲁卡牌组件
├── ⬜ AI Chat 前端
├── ⬜ 繁殖计算器 (含被动技能遗传)
├── ⬜ 搜索框 C 位 + 双语结果
└── ⬜ 后端工具扩展 (Palworld 查询工具)
```

## 常用命令

```bash
# 查看任务状态
bash scripts/sync-tasks.sh status

# 下一个可执行任务
bash scripts/sync-tasks.sh next

# 所有任务完成 → 提 PR
bash scripts/sync-tasks.sh pr

# 后端 Docker 启动
cd backend && docker compose up db app -d
```

## 关键约定

- 代码文件路径用 `kebab-case`，组件名用 `PascalCase`
- 提交格式: `feat:` / `fix:` / `docs:` / `data:` / `chore:`
- 不要在 `.specify/tasks/` 外写业务代码
- 先读 AGENTS.md + Constitution.md 再动手
