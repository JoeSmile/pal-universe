# PRD-007: 安全与运维

> Status: Draft · Author: AI Agent · Updated: 2026-07-19  
> Epic Lead: TBD · Dependencies: PRD-005 (架构定义)

---

## 1. 概述

构建 Pal Universe 的安全防护体系和运维监控系统。目标是**零安全漏洞生产环境**，**99.9% 可用性**，**全自动化运维**。

## 2. 安全体系

### 2.1 安全层级

```
Layer 1: 应用层安全
├── CSP (Content-Security-Policy) 严格策略
├── XSS 防护 (输入过滤 + 输出编码)
├── CSRF 防护 (SameSite Cookie + Token)
├── HTTPS 强制 + HSTS
└── Subresource Integrity (SRI)

Layer 2: API 安全
├── Rate Limiting (IP/User/Endpoint 层级)
├── 请求体大小限制 (10KB/chat, 1MB/file)
├── API Key 轮换 (AI 服务)
├── CORS 白名单
└── 输入 Schema 校验 (Zod)

Layer 3: 基础设施安全
├── Docker 镜像最小化 (非 root 用户运行)
├── 依赖漏洞扫描 (Dependabot + Trivy)
├── 运行时监控 (异常检测)
├── 日志审计 (敏感操作记录)
└── 备份策略 (代码/数据/配置)

Layer 4: AI 安全
├── Prompt Injection 防护
├── 输出内容审核
├── 成本控制告警
└── 用户隐私保护 (不记录敏感对话)
```

### 2.2 CSP 策略

```typescript
// next.config.ts
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: 
    https://raw.githubusercontent.com 
    https://static.wikia.nocookie.net;
  font-src 'self';
  connect-src 'self' 
    https://api.openai.com 
    https://api.deepseek.com 
    https://api.github.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
`
```

### 2.3 Rate Limiting 配置

```
AI Chat API:
  - 未登录: 10 请求/分钟/IP
  - 登录用户: 60 请求/分钟
  - 每日上限: 100 请求 (未登录) / 500 (登录)

数据 API:
  - 全局: 1000 请求/分钟
  - 单 IP: 100 请求/分钟

搜索 API:
  - 全局: 500 请求/分钟
  - 单 IP: 60 请求/分钟

Webhook (GitHub):
  - 白名单 IP: github.com 的 IP 段
```

## 3. 运维体系

### 3.1 监控栈

```
维度         工具                 指标
─────────────────────────────────────────────
性能监控    Vercel Analytics     LCP/FCP/CLS/INP
错误追踪    Sentry               JS Error/API Error/落栈
日志收集    Vercel Logs          API 请求/部署日志
可用性      Uptime Kuma          5分钟/次巡检
安全监控    GitHub Security      CVE/Dependabot Alerts
成本监控    自定义脚本            AI API 费用/带宽
在线人数    Vercel Analytics     DAU/MAU/页面访问
```

### 3.2 告警规则

| 告警 | 阈值 | 通知方式 |
|------|------|---------|
| 5xx 错误率 > 1% | 严重 | Telegram + Email |
| LCP > 3s (P95) | 警告 | Telegram |
| AI API 日费用 > $5 | 警告 | Telegram |
| 新 CVE 发现 | 看严重级别 | GitHub Issue |
| 站点不可用 (Uptime Kuma) | 严重 | Telegram + SMS |
| 磁盘使用率 > 80% | 警告 | Telegram |

### 3.3 备份策略

```
代码:
  → GitHub (主仓库, 自动)
  → 每周 release archive

数据 (JSON):
  → GitHub 仓库内 (版本控制, 自动)
  → 每周导出到 R2/S3 (自动)

配置:
  → GitHub Actions Secrets
  → .env.example 在仓库 (无敏感值)
  → 1Password/LastPass (敏感值)

数据库 (如果有):
  → 每日自动备份 R2
  → 保留 30 天
```

## 4. 验收标准

| ID | 标准 | 测试方式 |
|----|------|---------|
| AC-001 | CSP 策略在生产环境生效 | 在线 CSP 检查工具 |
| AC-002 | Rate Limiting 超限返回 429 + 友好提示 | E2E 测试 |
| AC-003 | XSS 注入尝试被拦截 | 安全测试用例 |
| AC-004 | API 请求无敏感信息泄露 | 抓包检查 |
| AC-005 | 依赖扫描每周未修复的 CVE 为 0 | GitHub Security |
| AC-006 | 站点可用性 > 99.9% (月) | Uptime Kuma |
| AC-007 | AI Chat 费用在预算内 | 成本监控脚本 |
| AC-008 | 备份可正常恢复 | 月度恢复演练 |

## 5. 依赖

- GitHub Security / Dependabot（内置）
- Vercel Analytics / Logs（内置）
- Sentry（错误追踪）
- Uptime Kuma（自部署）
- Telegram Bot（告警通知）
