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
| **Hermes** | PRD/文档编写、任务拆分与写入 `.specify/tasks/`、运行终端命令（测试/构建/lint/Semgrep/AC门禁）、数据清洗脚本、安全扫描、CI/CD 配置、Code Review、批量文件操作、整体验收验证 |
|| **Cursor** | 组件编码、交互逻辑、样式实现、内联 Debug、代码补全、AI Chat、本地验证通过后提交（AC + type-check + lint + test） |
|| **人** | 需求确认、PR Review、Merge 到 main |

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

## 代码验收流程（完整版）

```
Cursor 完成任务
  │
  ├── 1. 逐项勾选 AC [x]
  ├── 2. bun run type-check
  ├── 3. bun run lint
  ├── 4. bun run test
  ├── 5. bun run build
  ├── 6. git commit + push
  │
  ▼
人: 创建 PR（使用模板）
  │
  ▼
GitHub Actions CI（自动触发）
  │
  ├── CI: type-check / lint / test / build ──────── fasthway.flows ✅
  ├── Code Quality:
  │   ├── SDD AC 门禁 ─── 检查 AC 是否全部勾选
  │   ├── Semgrep ─────── 自定义安全规则扫描
  │   ├── Knip ────────── 死代码/未使用依赖检测
  │   └── PR 模板检查 ─── 描述格式合规
  ├── Lighthouse CI ───── 性能/无障碍/SEO 评分报告
  └── Data Validation ─── 数据完整性校验
  │
  ▼
Hermes: Code Review（request-code-review skill）
  │
  ▼
人: Review → Merge ✅
```

### Cursor 侧的验收要求

Cursor 在完成每个 task 后，必须：

1. **勾选所有 AC** — 在 task 文件里把 `- [ ]` 改为 `- [x]`
2. **运行本地验证**：
   ```bash
   cd frontend
   bun run type-check  # 类型检查无错误
   bun run lint        # 无 lint 错误
   bun run test        # 测试全部通过
   bun run build       # 构建成功
   ```
3. **确认无 Semgrep 警报**：
   ```bash
   # 本地安装后运行
   pip install semgrep && semgrep --config=.semgrep/rules/ frontend/src/ backend/
   ```
4. **更新任务状态**为 `completed`
5. **提交**：`git commit -m "feat: {task-name}" && git push`

> ⚠️ 任何验证未通过不得标记任务为 `completed`，须在任务文件标注失败原因。

## 参考

- [项目宪章](.specify/constitution.md)
- [功能规格](.specify/spec.md)
- [技术方案](.specify/plan.md)
- [Cursor 工作流规则](.cursor/rules/specify-workflow.mdc)
- [任务同步脚本](scripts/sync-tasks.sh)
- [代码验收流程](docs/architecture/CODE-ACCEPTANCE.md)
