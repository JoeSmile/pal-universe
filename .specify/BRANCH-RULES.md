# Pal Universe — 分支管理规则

> 所有 AI Agent（Hermes、Cursor、Subagent）必须遵守。
> 违反规则导致代码污染 = 回滚 + 删除分支。

---

## 一、分支命名规范

```
main                         生产分支，保护分支
                                └── 只能通过 PR 合并

feat/{task-id}-{简短描述}     功能分支（Task 专用）
                                ├── Hermes:  feat/012-api-pals
                                ├── Cursor:   feat/016-pal-detail
                                └── Subagent: feat/sub/cleanup-docs

fix/{简短描述}                修复分支
                                └── fix/breeding-api-timeout

chore/{简短描述}              工具/配置变更
                                └── chore/update-docker-compose
```

**禁止的命名：**
- ❌ `dev`、`develop`、`test` — 太模糊
- ❌ `patch-1`、`update` — GitHub 自动生成的，不要用
- ❌ 直接用 `main` 开发 — 永远不要

---

## 二、谁用什么分支

| Agent | 基底 | 分支名示例 | 说明 |
|-------|------|-----------|------|
| **Hermes** | `main` | `feat/012-api-pals` | 后端/Python/文档变更 |
| **Cursor** | `main` | `feat/016-pal-detail` | 前端/React/组件变更 |
| **Subagent** | `main` | `feat/sub/{描述}` | 批量文件操作/清理 |
| **人** | 任意 | 按需 | Merge PR 的操作者 |

---

## 三、工作流

```
人创建 Task → .specify/tasks/{id}-{name}.md
  │
  ├─ Hermes 接手:
  │   git checkout -b feat/{id}-{name} main
  │   实现 → git push → 创建 PR → 标记 task 完成
  │
  ├─ Cursor 接手:
  │   (Cursor 自动从 main 创建分支)
  │   实现 → git commit → git push → 创建 PR
  │
  └─ Subagent 接手:
      (Hermes 委托时指定分支名)
      实现 → git commit → git push
      → Hermes 验证后创建 PR
```

### 关键约束

```
1. 每个 Task 一个分支
   不允许一个分支做多个 Task
   不允许一个 Task 跨多个分支

2. 分支从 main 创建
   不允许从 feat 分支分叉

3. 分支生命周期
   创建 → 开发 → PR → Merge → 删除
   分支存活时间不超过 3 天
   超过 3 天未合并 → 通知人工处理

4. 提交信息必须带 task-id
   ✅ "feat: 添加帕鲁搜索 API (012)"
   ✅ "fix: 修复繁殖计算超时 (013)"
   ❌ "update code"、"fix bug"
```

---

## 四、Subagent 规则

Hermes 委托 Subagent 时，必须在 context 中指定：

```
委托 context 模板:
  分支名: feat/sub/{任务描述}
  基底: main
  提交规范: feat/fix/docs + 简短说明
  完成后: 不创建 PR，通知 Hermes 验证
```

Subagent **禁止**：
- ❌ 在 `main` 分支上直接提交
- ❌ 修改非自己 task 范围的文件
- ❌ 创建新分支（使用指定的分支名）
- ❌ 删除已有分支

---

## 五、PR 规范

```
PR title: [task-id] 简短描述
          例: [012] 帕鲁搜索 API

PR body: 引用 task 文件
         关联 issue（如果有）
         变更文件清单
         测试结果

Label:   feat / fix / chore / docs

Reviewer: 人（必须人工 Merge）
          Hermes 可以创建 PR 但不能 Merge
          Cursor 不能创建 PR（只能 push 分支）
```

### 合并条件

```
□ CI (type-check/lint/build) 通过
□ Task AC 全部勾选
□ 无未解决的 review comments
□ 分支与 main 无冲突
□ 后端: ruff + pyright 通过
□ 前端: bun run build 通过
```

---

## 六、紧急修复流程

生产环境出 bug 时：

```
1. 从 main 创建 fix 分支
   git checkout -b fix/{描述} main

2. 修复 → commit → push → PR

3. PR 标题加 [URGENT] 前缀
   人尽快 Merge

4. 修复后补 Task 文件
```

---

## 七、违反规则的后果

| 违规行为 | 后果 |
|---------|------|
| 直接在 main 提交 | 分支删除 + 代码回滚 |
| 分支名不规范 | 强制重命名 |
| 提交信息无 task-id | squash merge + 重写 |
| Subagent 乱改代码 | 停止委托权限 |
