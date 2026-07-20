# Pal Universe — 分支规则（精简版）

> 目标：Hermes 和 Cursor 同时干活不冲突。
> 原则：不要因为分支管理增加工作量。

---

## 核心规则

```
每个 Task 一个分支，两人推同一个分支
Hermes 改后端文件 → 推
Cursor 改前端文件 → 推
互不重叠，不会冲突
```

```
──────────────────────────────────────────
      Task 016: 帕鲁详情页
──────────────────────────────────────────
  Hermes: 后端 API           →  推 feat/016
  Cursor: 前端页面组件        →  推 feat/016
            ↑ 同一个分支，文件不重叠
──────────────────────────────────────────
```

## 什么情况下会冲突

```
只有一人同时改了同一个文件时才会冲突
Hermes: backend/app/api/v1/pals.py
Cursor: 永远不会碰 backend/ 下的文件

Cursor: frontend/src/app/pals/[name]/page.tsx
Hermes: 永远不会碰 frontend/src/ 下的文件

→ 只要各管各的，零冲突
```

## 禁止

- ❌ 各自建分支 → 制造合并负担
- ❌ 直接在 main 提交 → 必须经过 feat 分支
- ❌ 改对方的文件 → Hermes 不改前端，Cursor 不改后端

## 合并流程

```
feat 分支开发完成
  → 人审核
  → 人合并到 main
  → 删 feat 分支
```
