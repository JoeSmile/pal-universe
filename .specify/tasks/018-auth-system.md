# 018-auth-system

## Status
- status: pending
- assigned_to: hermes
- depends_on: [015]

## Goal

实现用户注册/登录系统，JWT 认证，用于 Chat 成本控制和速率限制分级。

---

## 设计原则

**尽量复用现有代码。** 后端 `auth.py` 已有全套 JWT 注册/登录/会话管理，只是之前被禁用。需要做的是：

1. 启用 auth 端点
2. 创建登录/注册 UI
3. 前端存 JWT token，Chat 请求带 token
4. 设置分级速率限制

---

## 一、后端（Hermes 做）

### 1.1 确认/修复 auth 端点

后端已有（在 `fda3da1` main 分支上）：
```
POST /api/v1/auth/register    → 注册
POST /api/v1/auth/login       → 登录 → 返回 JWT
GET  /api/v1/auth/session     → 验证 token
```

需要：
- [ ] 确认端点都工作（curl 测试）
- [ ] 修复 Chat 端点：有 token → 用 user_id 做成本追踪；无 token → 匿名用户，更严格限流

### 1.2 分级速率限制

| 用户类型 | Chat 调用 | 日 token 预算 |
|---------|----------|--------------|
| 匿名（无 token） | 5 次/天 | 5,000 |
| 注册用户 | 50 次/天 | 50,000 |

- [ ] `CircuitBreakerMiddleware` 区分匿名/已认证用户
- [ ] 匿名用户达到限制时提示"注册后获得更多额度"

### 1.3 成本追踪关联 user_id

- [ ] `CostTracker` 支持按 user_id（已登录）和按 IP（匿名）双重维度
- [ ] 审计日志记录 user_id（如果有）

---

## 二、前端（Cursor 做）

### 2.1 登录/注册 UI

```
┌─────────────────────┐    ┌─────────────────────┐
│  登录                │    │  注册                │
│                     │    │                     │
│  邮箱/用户名         │    │  邮箱                │
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

- [ ] `frontend/src/app/auth/login/page.tsx`
- [ ] `frontend/src/app/auth/register/page.tsx`
- [ ] 表单验证（邮箱格式、密码长度 > 6）
- [ ] 错误提示（"用户名已存在"、"密码错误"）
- [ ] 注册成功后自动登录

### 2.2 JWT 存储

- [ ] 登录成功后 token 存入 `localStorage`（key: `auth_token`）
- [ ] 所有 Chat 请求 header 带上 `Authorization: Bearer {token}`
- [ ] token 过期（24h）后提示重新登录
- [ ] 退出登录清空 token

### 2.3 UI 集成

- [ ] 首页右上角显示"登录/注册"或"用户名 + 退出"
- [ ] Chat 使用量剩余显示（"今日剩余: 42/50 次"）
- [ ] 匿名用户 Chat 时底部提示"注册后获得更多额度"

---

## 三、不做

- ❌ 邮箱验证
- ❌ 密码重置
- ❌ OAuth/第三方登录
- ❌ 用户头像/昵称修改
- ❌ 用户列表/管理后台

---

## 四、文件变更

### Hermes
- `backend/app/api/v1/auth.py` — 确认/修复端点
- `backend/app/core/cost_tracker.py` — 支持 user_id 维度
- `backend/app/core/middleware.py` — 认证用户宽松限流

### Cursor
- `frontend/src/app/auth/login/page.tsx`
- `frontend/src/app/auth/register/page.tsx`
- `frontend/src/components/auth-form.tsx`
- `frontend/src/lib/auth-store.ts` — 管理 token
- `frontend/src/components/chat-usage.tsx` — 用量显示

---

## 验收标准

- [ ] `curl POST /api/v1/auth/register` 返回 token
- [ ] `curl POST /api/v1/auth/login` 返回 token
- [ ] 带 token 调 Chat → 50 次/天额度
- [ ] 无 token 调 Chat → 5 次/天额度
- [ ] 超限时返回 429 + 友好提示
- [ ] 前端登录/注册流程完整
- [ ] ruff + pyright 通过
- [ ] TypeScript type-check 通过
