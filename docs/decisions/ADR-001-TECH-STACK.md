# ADR-001: 技术栈选型

> Status: Accepted · Author: AI Agent · Updated: 2026-07-19

---

## 背景

选择 Pal Universe 前端项目的技术栈。需要满足：
1. 静态和动态页面混合渲染
2. 丰富的交互动画
3. 流式 AI 响应
4. 类型安全
5. 极致的性能
6. 自动化友好的构建流程

## 决策

### 前端框架: Next.js 15 (App Router)

**选型理由：**

| 需求 | Next.js 15 方案 | 优势 |
|------|----------------|------|
| 静态页面 | SSG (Static Generation) | 帕鲁列表/详情预构建 HTML |
| 动态页面 | Streaming SSR + RSC | AI Chat 流式响应 |
| 增量更新 | ISR (Incremental Static Regeneration) | 游戏更新后自动再生 |
| 图片优化 | `<Image>` 组件 | 自动 WebP/AVIF + 懒加载 |
| 路由 | App Router (File-based) | 清晰的文件结构 |
| SEO | Server Components + Metadata API | 爬虫友好 |

**放弃方案：**
- Remix: 流式 SSR 支持不如 Next.js 成熟
- Astro: 对 SSR streaming 支持较弱
- Pure SPA (Vite): 缺少 SSR, SEO 差

### 运行时: Bun

已有 Dockerfile 使用 Bun，保留。

**理由：**
- 比 Node.js 快 4x 的包安装和脚本执行
- 内置 TypeScript 支持，省去 ts-node
- 兼容 Node.js API
- 用于脚本 (数据同步、知识库构建、检查工具)

### 样式: Tailwind CSS v4 + Radix UI

已有配置，保留。Tailwind v4 的 CSS-first 配置比 v3 更灵活。

### 状态管理: Zustand + TanStack React Query

已有配置，保留。

**分工：**
- Zustand: 客户端状态 (UI 状态、聊天对话、地图配置)
- React Query: 服务端状态 (数据请求、缓存、更新)

### 动画引擎: Framer Motion

**理由：**
- 声明式 API，与 React 完美结合
- 支持 Layout 动画（筛选时卡片重新排列自动动画）
- Spring physics（更自然的弹性动画）
- `AnimatePresence`（进出场动画）

**数据可视化:**
- 繁殖树: React Flow（有向图）
- 地图: Leaflet + React-Leaflet（已有）
- 属性图表: Recharts（已有）

### AI 聊天引擎

| 组件 | 选型 | 理由 |
|------|------|------|
| LLM API | DeepSeek (主) + OpenAI (备) | 成本低 + 效果好 |
| Streaming | Server-Sent Events (SSE) | 原生支持，无需 WebSocket |
| RAG | 本地 JSON 检索 + 向量化 | 省去额外基础设施 |
| Embedding | OpenAI text-embedding-3-small | 性价比最优 |

### CI/CD: GitHub Actions + Vercel

GitHub Actions 负责质量门禁，Vercel 负责部署。零额外基础设施成本。

## 影响

### 正面

- 全栈 TypeScript，端到端类型安全
- 开发效率高（Next.js + Tailwind 生态成熟）
- 部署简单（Vercel 一键）
- 性能极致（Edge + ISR + Image Optimization）
- 社区资源丰富

### 负面

- 构建时间依赖 Vercel（vendor lock-in）
- AI API 有使用成本（需 Rate Limiting + 缓存）
- Next.js 版本更新频繁（需锁定版本）

## 替代方案

### 后端架构

- **方案 A（当前选择）**：Next.js API Routes + LLM API
  - 优点：前后端统一、部署简单
  - 缺点：LLM 调用时占用 Node.js 事件循环

- **方案 B**：Next.js 前端 + Python FastAPI 后端
  - 优点：Python 生态成熟（LangChain、RAG 工具）
  - 缺点：多一个服务需要运维
  - **适用时机**：AI Chat 功能复杂到需要独立服务时，可平滑迁移

### 数据存储

- **方案 A（当前选择）**：GitHub 上的 JSON 文件 + 浏览器缓存
  - 优点：零数据库运维，免费，版本控制
  - 缺点：不适合用户生成数据

- **方案 B**：SQLite / PostgreSQL
  - **适用时机**：需要用户系统、收藏、评论等功能时

## 结论

Accepted. 选用 Next.js 15 (App Router) + TypeScript + Tailwind v4 作为核心栈，Bun 作为运行时。

## 参考

- Next.js 15 Docs: https://nextjs.org/docs
- Tailwind CSS v4: https://tailwindcss.com/docs/v4
- Framer Motion: https://www.framer.com/motion/
- Verce l: https://vercel.com/docs
