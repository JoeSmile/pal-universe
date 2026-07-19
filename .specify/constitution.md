# Pal Universe 项目宪章

> 本文档是项目的"宪法"——规定了所有 AI Agent（Hermes、Cursor）的开发行为准则。
> 任何 Agent 在生成代码前必须首先理解并遵守本文档。

---

## 一、项目定位

Pal Universe 是 Palworld 的超级百科工具站。核心差异化：AI 聊天助手 + TCG 级卡牌 UI + 繁殖可视化 + 全自动化开发飞轮。

## 二、技术约束

### 2.1 前端

- **框架**：Next.js 15 (App Router) + React 19
- **样式**：Tailwind CSS v4 + Radix UI（不要用其他 UI 库）
- **状态管理**：Zustand（客户端状态）+ TanStack React Query（服务端状态）
- **动画**：Framer Motion（不要用 GSAP 或其他）
- **地图**：Leaflet + React-Leaflet
- **类型**：TypeScript strict 模式，`noUncheckedIndexedAccess: true`
- **路径别名**：`@/*` → `./src/*`

### 2.2 后端

- **框架**：FastAPI + Uvicorn（已有，直接复用 `backend/`）
- **AI 编排**：LangGraph StateGraph（已有，直接复用）
- **LLM 调用**：LangChain ChatOpenAI（已有 LLMRegistry）
- **数据库**：PostgreSQL 16 + pgvector
- **长期记忆**：mem0（已有，直接复用）
- **认证**：JWT（已有，直接复用）
- **速率限制**：slowapi（已有）
- **监控**：Langfuse + Prometheus + Grafana（已有）

### 2.3 数据

- **帕鲁数据**：palworld-kb（清洗后入库 pgvector）
- **地图数据**：palworld-atlas-data（JSON 静态文件）
- **图片**：mlg404/paldex-api（GitHub raw）
- **中文名**：LLM 批量翻译

### 2.4 基础设施

- **部署**：Vercel（前端）+ Docker Compose（后端）
- **CI/CD**：GitHub Actions
- **镜像**：pgvector/pgvector:pg16（本地已有）

## 三、代码规范

### 3.1 通用

- 所有文件必须 TypeScript strict 模式通过
- 所有函数必须有类型标注（包括返回值）
- 优先纯函数，避免 class（除 Radix UI 组件和服务层）
- 文件名：kebab-case（如 `pal-card.tsx`）
- 组件名：PascalCase（如 `PalCard`）
- 工具函数：camelCase（如 `formatBreedingRank`）

### 3.2 React 组件

- 使用 Server Component 默认（除非需要客户端交互）
- 客户端组件在文件顶行标注 `"use client"`
- Props 使用 TypeScript interface（不要用 type），以 `Props` 结尾
- 使用 Radix UI 原语 + Tailwind 自定义样式，不写裸 CSS

### 3.3 后端 Python

参照 `backend/AGENTS.md`：
- 所有 import 在文件顶部
- 使用 structlog（事件名 lowercase_with_underscores）
- 重试用 tenacity
- 所有路由加 rate limiting
- 所有 LLM 调用加 Langfuse 追踪
- 数据库操作用 async

### 3.4 提交规范

```
feat: 新功能
fix: 修复
docs: 文档
refactor: 重构
test: 测试
chore: 构建/工具
data: 数据更新
```

## 四、协作契约

### 4.1 谁做什么

| Agent | 职责 |
|-------|------|
| **Hermes** | PRD/文档、任务拆分、终端命令（测/构建/lint）、批量文件操作、安全扫描、CI/CD、数据清洗脚本、Code Review |
| **Cursor** | 组件编码、交互逻辑、样式微调、内联 Debug、代码补全 |

### 4.2 共享状态

`.specify/` 目录是双方的信息交换层：

| 文件 | 写入者 | 读取者 | 用途 |
|------|--------|--------|------|
| `constitution.md` | Hermes | 双方 | 项目宪章 |
| `spec.md` | Hermes | 双方 | 功能规格 |
| `plan.md` | Hermes | 双方 | 技术方案 |
| `tasks/*.md` | Hermes | Cursor | 待执行任务 |
| `tasks/*.md`（状态更新） | Cursor | Hermes | 执行结果 |

### 4.3 工作流

```
1. Hermes 拆解需求 → 写入 .specify/tasks/{id}-{name}.md
2. Cursor 检测到新任务 → 读取任务 → 实现 → git commit
3. Cursor 更新任务文件: status → completed/failed
4. Hermes 轮询检测到完成 → 验证 → 进入下一任务
5. 全完成后 → Hermes git push + 创建 PR
6. 人审批 Merge
```

### 4.4 禁止行为

- ❌ 不要在非任务文件里写业务代码（应当写在对应的 task 里）
- ❌ 不要修改 `.specify/` 下的文件结构（新增 task 文件除外）
- ❌ 跳过 `.cursor/rules/` 中的工作流规则
- ❌ 直接合并到 main（必须走 PR）
- ❌ 硬编码敏感信息（用环境变量 + `.env.example`）

## 五、质量门禁

每次提交必须通过：

1. ✅ `tsc --noEmit`（TypeScript 类型检查）
2. ✅ `eslint .`（代码规范）
3. ✅ `prettier --check .`（格式）
4. ✅ `vitest run`（单元测试）
5. ✅ `bun run build`（构建）

后端的 Python 代码额外通过：
6. ✅ `ruff check .`
7. ✅ `pyright`（类型检查）

## 六、安全约束

- CSP 严格策略（见 PRD-007）
- 所有用户输入 XSS 过滤
- API Rate Limiting（每 IP 10次/分钟 chat）
- 无敏感信息在代码中
- 依赖 CVE 扫描（每周自动）
