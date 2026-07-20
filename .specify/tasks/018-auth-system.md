# 018-auth-system

## Status
- status: completed
- assigned_to: cursor
- depends_on: [015]

## Goal

实现用户注册/登录系统、JWT 认证、Chat 成本控制前端 UI。

---

## 已完成（Hermes）

### 后端 API
- [x] POST /api/v1/auth/register — 注册，返回 JWT token
- [x] POST /api/v1/auth/login — 登录，返回 JWT token
- [x] 数据库迁移（alembic）user/session 表就绪
- [x] 密码验证（大写+小写+数字+特殊字符+8位）

### 分级限流（Redis）
- [x] 匿名: 5 次/天/IP
- [x] 登录: 50 次/天/IP（IP 全局限制，换账号没用）
- [x] 注册限流: 同 IP 每天 3 个账号
- [x] 账号切换检测: 5 分钟换 3 个账号 flag 可疑
- [x] CircuitBreakerMiddleware 返回 429 + 中文提示

---

## Cursor 要做

### 2.1 登录/注册 UI

```
┌─────────────────────┐    ┌─────────────────────┐
│  登录                │    │  注册                │
│                     │    │                     │
│  邮箱                │    │  邮箱                │
│  ┌─────────────┐    │    │  ┌─────────────┐    │
│  │             │    │    │  │             │    │
│  └─────────────┘    │    │  └─────────────┘    │
│                     │    │                     │
│  密码               │    │  用户名              │
│  ┌─────────────┐    │    │  ┌─────────────┐    │
│  │             │    │    │  │             │    │
│  └─────────────┘    │    │  └─────────────┘    │
│                     │    │                     │
│  [登录]  [注册→]    │    │  密码               │
└─────────────────────┘    │  ┌─────────────┐    │
                           │  │             │    │
                           │  └─────────────┘    │
                           │                     │
                           │  确认密码            │
                           │  ┌─────────────┐    │
                           │  │             │    │
                           │  └─────────────┘    │
                           │                     │
                           │  [注册]  [← 登录]   │
                           └─────────────────────┘
```

- [x] `frontend/src/app/auth/login/page.tsx`
- [x] `frontend/src/app/auth/register/page.tsx`
- [x] 表单验证（邮箱格式、密码强度对齐后端）
- [x] 错误提示（如"邮箱已存在"、"密码错误"）
- [x] 注册成功后自动登录

### 2.2 JWT 存储

- [x] 登录成功后 token 存入 localStorage（key: `auth_token`）
- [x] 所有 Chat 请求 header 带上 `Authorization: Bearer {token}`
- [x] token 过期后提示重新登录
- [x] 退出登录清空 token

### 2.3 UI 集成

- [x] 首页右上角显示"登录/注册"或"用户名 + 退出"
- [x] Chat 使用量剩余显示（"今日剩余: 42/50 次"）
- [x] 匿名用户 Chat 时底部提示"注册后获得更多额度"

---

## 不做

- ❌ 邮箱验证
- ❌ 密码重置
- ❌ OAuth/第三方登录
- ❌ 用户头像/昵称修改

---

## 文件变更

- `frontend/src/app/auth/login/page.tsx` — 新增
- `frontend/src/app/auth/register/page.tsx` — 新增
- `frontend/src/components/auth-form.tsx` — 新增（可复用组件）
- `frontend/src/lib/auth-store.ts` — 新增（管理 token）
- `frontend/src/components/chat-usage.tsx` — 新增（用量显示）
- `frontend/src/lib/api/auth.ts` — 新增
- `frontend/src/lib/chat-api.ts` — 新增（SSE + Bearer）
- `backend/app/core/middleware.py` — JWT claim 读 `sub`

---

## 验收标准

- [x] 登录/注册页面渲染正常
- [x] 注册 → 自动登录 → 跳转首页
- [x] 登录 → 首页右上角显示用户名
- [x] 登录后 Chat 带 token → 50 次/天额度
- [x] 未登录 Chat → 5 次/天额度 + 提示注册
- [x] 退出 → token 清除
