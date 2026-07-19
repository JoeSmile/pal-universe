# Pal Universe — AI Agent 协作手册

本文档定义了 **Hermes Agent** 和 **Cursor** 之间的协作流程。

---

## 快速命令

```bash
# 查看任务状态
./scripts/sync-tasks.sh status

# 查看下一个可执行任务
./scripts/sync-tasks.sh next

# 校验已完成任务
./scripts/sync-tasks.sh verify

# 全部完成 → 提 PR
./scripts/sync-tasks.sh pr
```

## 协作结构

```
.specify/                        ← 共享契约层（双方读写）
├── constitution.md              ← 项目宪章（行为准则）
├── spec.md                      ← 功能规格（要构建什么）
├── plan.md                      ← 技术方案（怎么构建）
└── tasks/                       ← 任务队列
    ├── 001-xxx.md               ← pending / in_progress / completed / failed
    └── ...

.cursor/rules/
└── specify-workflow.mdc         ← Cursor 读取的工作流规则

scripts/
└── sync-tasks.sh                ← 任务同步脚本（Hermes 调用）
```

## 角色分工

| 角色 | 职责 |
|------|------|
| **Hermes** | PRD/文档编写、任务拆分与写入 `.specify/tasks/`、运行终端命令（测试/构建/lint）、数据清洗脚本、安全扫描、CI/CD 配置、Code Review、批量文件操作 |
| **Cursor** | 组件编码、交互逻辑、样式实现、内联 Debug、代码补全、AI Chat |
| **人** | 需求确认、PR Review、Merge 到 main |

## 工作流

```
人: "我要做一个帕鲁卡牌"
  │
  ▼
Hermes: 拆解需求 → 写入 .specify/tasks/
  │   ├── 001-pal-card-component.md
  │   ├── 002-pal-card-grid.md
  │   └── 003-pal-card-search.md
  │
  ▼
Cursor: 检测到新任务文件 → 自动执行
  │   ├── 读取 001 任务
  │   ├── 实现 PalCard 组件
  │   ├── 运行测试
  │   └── git commit + 更新任务状态为 completed
  │
  ▼
Hermes: 轮询检测 → 验证完成
  │   ├── ./scripts/sync-tasks.sh status
  │   ├── 检查代码质量
  │   └── 进入下一任务
  │
  ▼
... 循环直到所有任务完成 ...

  ▼
Hermes: git push + 创建 PR
  │
  ▼
人: Review → Merge ✅
```

## 任务文件模板

```markdown
# 001-pal-card-component

## 状态
- status: pending
- assigned_to: cursor

## 目标
创建 PalCard 基础组件

## 文件清单
- Create: src/components/pal-card.tsx
- Create: src/components/pal-card.test.tsx

## 验收标准
- [ ] 渲染帕鲁名称和属性
- [ ] 悬停有微动效
- [ ] 测试通过
- [ ] TypeScript 类型检查通过

## 实现提示
- 使用 Tailwind CSS v4
- 参考 .specify/spec.md 的设计描述
- 属性徽章用 Lucide 图标
```

## 规范

- 所有业务代码通过 `.specify/tasks/` 驱动，不在任务文件外写代码
- Agent 之间不直接通信，通过文件系统和 git 交换信息
- 每次修改后运行 `bun run type-check && bun run lint`
- 任务完成后 `git commit`，不要一次提交多个任务
- 人只负责：确认需求、Merge PR

## 参考

- [项目宪章](.specify/constitution.md)
- [功能规格](.specify/spec.md)
- [技术方案](.specify/plan.md)
- [Cursor 工作流规则](.cursor/rules/specify-workflow.mdc)
- [任务同步脚本](scripts/sync-tasks.sh)
