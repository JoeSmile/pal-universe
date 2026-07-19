# Pal Universe 代码验收流程

> 本文档定义了从「Cursor 完成任务」到「人 Merge PR」的完整验收流程。
> 所有参与者（Cursor、CI、Hermes、人）各自有明确的责任。

---

## 流程全景

```
Cursor 完成任务
  │
  ├── 1. 勾选所有 AC [x]
  ├── 2. 本地验证（type-check / lint / test / build / semgrep）
  ├── 3. git commit + push
  │
  ▼
人: 创建 PR（使用 PULL_REQUEST_TEMPLATE.md，勾选本地验证确认项）
  │
  ▼
GitHub Actions — 自动触发 3 个 workflow
  │
  ├── ci.yml
  │   ├── TypeScript type-check
  │   ├── ESLint
  │   ├── Test (vitest)
  │   ├── Build
  │   └── Data validation
  │
  ├── code-quality.yml
  │   ├── SDD AC 门禁  ── 检查 task 文件 AC 全部勾选
  │   ├── Semgrep      ── 自定义安全规则
  │   ├── Knip         ── 死代码检测
  │   └── PR 模板检查  ── 描述格式合规
  │
  └── lighthouse.yml
      └── Lighthouse CI ── 性能 ≥80 / 无障碍 ≥90
  │
  ▼
Hermes: Code Review（request-code-review skill）
  │   ├── 检查代码质量
  │   ├── 检查 CI 全部绿色
  │   └── 检查 AC 全部覆盖
  │
  ▼
人: Review → Merge ✅
```

---

## 各角色职责

### Cursor（提交前）

| # | 步骤 | 命令 |
|---|------|------|
| 1 | 勾选 AC | 编辑 task 文件，`- [ ]` → `- [x]` |
| 2 | 类型检查 | `bun run type-check` |
| 3 | Lint | `bun run lint` |
| 4 | 测试 | `bun run test` |
| 5 | 构建 | `bun run build` |
| 6 | 安全扫描 | `semgrep --config=.semgrep/rules/ --severity=ERROR frontend/src/ backend/` |
| 7 | 数据验证 | `python3 scripts/validate_data.py` |
| 8 | 提交 | `git commit -m "feat: {task-name}" && git push` |

> ⚠️ **任何验证未通过，不得标记 completed，不得提交。**

### GitHub Actions CI（自动）

| workflow | job | 职责 | 失败时 |
|----------|-----|------|--------|
| `ci.yml` | quality-gate | type-check / lint / test / build | ❌ 阻止合并 |
| `ci.yml` | data-validation | 数据完整性 | ❌ 阻止合并 |
| `code-quality.yml` | sdd-ac-gate | AC 完整性 | ❌ 阻止合并 |
| `code-quality.yml` | semgrep | 安全规则 | ❌ 阻止合并 |
| `code-quality.yml` | knip | 死代码检测 | ⚠️ 警告 |
| `code-quality.yml` | pr-template-check | 模板格式 | ❌ 阻止合并 |
| `lighthouse.yml` | lighthouse | 性能 ≥80 / 无障碍 ≥90 | ⚠️ 警告 |

### Hermes（Code Review）

1. 运行 `scripts/sync-tasks.sh status` 确认所有 task 状态
2. 运行 `scripts/check-ac-gate.sh` 确认 AC 完整性
3. 审阅代码质量（request-code-review skill）
4. 确认 CI 所有 job 通过
5. 确认 PR 描述完整
6. 如果没有问题 → **创建 PR**（人只需要 Review + Merge）

### 人

- Review PR 代码
- 确认 UI 改动有截图
- 确认 CI 全绿
- Merge ✅

---

## 质量门禁清单

### CI 自动门禁（11 项）

| # | 门禁 | 工具 | 阈值 |
|---|------|------|------|
| 1 | TypeScript 类型检查 | `tsc --noEmit` | 零错误 |
| 2 | 代码规范 | `eslint .` | 零错误 |
| 3 | 格式 | `prettier --check .` | 零差异 |
| 4 | 单元测试 | `vitest run` | 全部通过 |
| 5 | 构建 | `bun run build` | 成功 |
| 6 | AC 完整性 | `scripts/check-ac-gate.sh` | 零未勾选 AC |
| 7 | 安全扫描 | Semgrep | 零 ERROR |
| 8 | 死代码检测 | Knip | 零未使用导出 |
| 9 | PR 模板检查 | grep PR 描述 | 包含所有章节 |
| 10 | 性能审计 | Lighthouse CI | Perf ≥80 / A11y ≥90 |
| 11 | 数据完整性 | `scripts/validate_data.py` | 通过 |

### 本地验证（Cursor 提交前，6 项）

| # | 验证项 | 命令 |
|---|--------|------|
| 1 | AC 已全部勾选 | 手动检查 task 文件 |
| 2 | TypeScript 类型检查 | `bun run type-check` |
| 3 | Lint | `bun run lint` |
| 4 | 测试 | `bun run test` |
| 5 | 构建 | `bun run build` |
| 6 | 安全扫描 | `semgrep --config=.semgrep/rules/ --severity=ERROR frontend/src/ backend/` |

---

## Makefile 快捷命令

```bash
make check        # 基础检查: lint + type-check + validate + build
make check-all    # 全量检查: check + ac-gate + semgrep + knip
make gate         # 门禁专用: ac-gate + semgrep
make ac-gate      # AC 完整性检查
make semgrep      # 安全扫描
make knip         # 死代码检测
```

---

## Renovate（依赖更新）

Renovate Bot 配置在 `renovate.json`，每个周末自动发依赖更新 PR。

- patch 版本自动合并
- devDependencies 自动合并
- React/Next.js 等大包每两周合并一次
- 安全漏洞即时告警

---

## 故障处理

### 如果 CI 失败

1. 查看对应 job 的日志
2. Cursor 修复代码
3. 重新 push → CI 自动重跑

### 如果 Semgrep 发现误报

在 `.semgrep/rules/` 的对应规则文件中加 `pattern-not` 排除，或在该文件顶部加 `nosemgrep` 注释。

### 如果 AC 门禁拦截

说明 task 文件中有未勾选的验收标准。Cursor 需要：
1. 确认是否确实完成了该项
2. 如果完成 → 勾选该项
3. 如果未完成 → 补完代码再勾选
4. 重新提交
