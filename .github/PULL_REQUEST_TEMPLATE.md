## 描述

请简要描述这个 PR 做了什么。

## 关联任务

- 关联 Task: `.specify/tasks/{task-id}.md`
- 关联 Issue: #

## 改动文件

- `path/to/file` — 改动说明

## 验收检查

### Cursor 本地验证（提交前已确认）

- [ ] 所有 Task AC 已勾选（`- [x]`）
- [ ] 本地 `bun run type-check` 通过
- [ ] 本地 `bun run lint` 通过
- [ ] 本地 `bun run build` 通过
- [ ] 本地 `bun run test` 通过
- [ ] 本地 `python3 scripts/validate_data.py` 通过
- [ ] 本地 Semgrep 无 ERROR（`semgrep --config=.semgrep/rules/`）
- [ ] 新增代码有测试覆盖

### CI 门禁（自动执行）

- [ ] CI (type-check/lint/test/build) ✅
- [ ] SDD AC 门禁 ✅
- [ ] Semgrep 安全扫描 ✅
- [ ] Knip 死代码检测 ✅
- [ ] Lighthouse CI (Perf ≥80 / A11y ≥90) ✅
- [ ] PR 模板检查 ✅

## 截图（UI 改动必填）

<!-- 如果是 UI 改动，请附上 Before/After 截图 -->

## 其他

<!-- 还有什么需要 Reviewer 注意的？ -->
