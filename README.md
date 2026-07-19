# Pal Universe 🎮

> Palworld 超级百科 —— 比游戏本身还精致的帕鲁数据库

## 🚀 项目愿景

打造 Palworld 领域**最好看、最好用、最智能**的数据库站点。  
不只是数据展示，而是集 **AI 聊天助手、3D 卡牌系统、繁殖可视化、聚合地图、自动化运维**于一体的 Palworld 超级工具站。

## 🏗️ 项目架构

```
pal-universe/
├── frontend/                  # Next.js 15 前端
│   ├── app/                   # App Router 页面
│   ├── components/            # 组件库
│   │   ├── pal-card/         # 帕鲁卡牌系统
│   │   ├── breeding-tree/    # 繁殖可视化
│   │   ├── chat/             # AI 聊天 UI
│   │   └── map/              # 互动地图
│   ├── data/                 # JSON 数据缓存
│   ├── lib/                  # 工具库
│   └── public/images/        # 图片资源
├── docs/                     # 项目文档
│   ├── epics/                # Epic PRD 拆分
│   ├── architecture/         # 架构文档
│   ├── decisions/            # 架构决策记录 (ADR)
│   └── scripts/              # 自动化脚本文档
├── scripts/                  # 数据同步/构建脚本
├── .github/                  # GitHub Actions
│   └── workflows/
└── infra/                    # 基础设施配置
```

## 📚 文档索引

| 文档 | 说明 |
|------|------|
| [项目总 PRD](docs/PRD-000-PROJECT-OVERVIEW.md) | 整体产品需求定义 |
| [Epic 1: 帕鲁卡牌系统](docs/epics/PRD-001-PAL-CARD-SYSTEM.md) | 卡牌 UI、列表页、详情页 |
| [Epic 2: AI 聊天助手](docs/epics/PRD-002-AI-CHAT-ASSISTANT.md) | 智能问答、RAG 知识库 |
| [Epic 3: 繁殖可视化树](docs/epics/PRD-003-BREEDING-VISUALIZER.md) | 双向繁殖计算、基因图谱 |
| [Epic 4: 互动地图](docs/epics/PRD-004-INTERACTIVE-MAP.md) | 多层聚合地图、位置标注 |
| [Epic 5: 性能与架构](docs/epics/PRD-005-PERFORMANCE-ARCHITECTURE.md) |  SSR/ISR、CDN、边缘计算 |
| [Epic 6: 自动化 Pipeline](docs/epics/PRD-006-AUTOMATION-PIPELINE.md) | 需求→代码→审查→部署全自动 |
| [Epic 7: 安全与运维](docs/epics/PRD-007-SECURITY-DEVOPS.md) | 安全扫描、监控、备份 |
| [架构决策记录](docs/decisions/ADR-001-TECH-STACK.md) | 技术选型与权衡 |

## 🎯 核心差异化

1. **AI 聊天助手** — 自然语言查询帕鲁/繁殖/配方，实时流式回答
2. **帕鲁卡牌系统** — TCG 级交互动画卡片，属性对比、悬浮预览
3. **繁殖可视化树** — 多代推演路线图，AI 自动规划最优繁殖路径
4. **超聚合地图** — 四层可叠加信息（帕鲁/资源/Boss/传送）
5. **全自动化飞轮** — 从需求 Issue 到生产部署零人工干预

## 🛠️ 技术栈

| 层级 | 技术选型 |
|------|---------|
| 前端框架 | Next.js 15 (App Router) + React 19 |
| 样式 | Tailwind CSS v4 + Radix UI |
| 状态管理 | Zustand + TanStack React Query |
| 动画 | Framer Motion / GSAP |
| 地图 | Leaflet + React-Leaflet |
| 数据 | JSON (GitHub 源 → 静态构建) |
| AI 引擎 | DeepSeek / OpenAI API + RAG |
| CI/CD | GitHub Actions + Vercel |
| 安全 | Semgrep + CodeQL + Dependabot |
| 质量 | Vitest + Playwright + ESLint + Prettier |

## 📦 数据来源

- [mlg404/palworld-paldex-api](https://github.com/mlg404/palworld-paldex-api) — 帕鲁 JSON 数据 + 图片
- [blaynem/paldex](https://github.com/blaynem/paldex) — 游戏解包数据补充
- Palworld Wiki / Fandom — 高清图补充

## 🔄 自动化飞轮

```
用户提 Issue (需求) 
  → Agent 解析需求 → 自动生成技术方案
  → Agent 编码实现 → 创建 PR
  → AI Code Review + 安全扫描 + 自动测试
  → 自动部署 Preview 环境
  → 人工 Merge → 自动部署生产
  → 📊 自动生成周报
```

## 🚦 项目状态

- [ ] Phase 1: 项目初始化 + 基础骨架
- [ ] Phase 1: 帕鲁卡牌系统
- [ ] Phase 1: AI 聊天助手
- [ ] Phase 1: 繁殖可视化树
- [ ] Phase 1: CI/CD + 自动化管道
- [ ] Phase 2: 互动地图
- [ ] Phase 2: 性能优化 + 国际化
- [ ] Phase 2: 安全体系完善
- [ ] Phase 3: 社区功能 + 持续迭代
