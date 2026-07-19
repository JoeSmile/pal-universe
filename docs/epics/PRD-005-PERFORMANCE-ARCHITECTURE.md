# PRD-005: 性能与架构

> Status: Draft · Author: AI Agent · Updated: 2026-07-19  
> Epic Lead: TBD · Dependencies: PRD-000 (整体架构)

---

## 1. 概述

定义 Pal Universe 的技术架构和性能目标。目标是**全站 Lighthouse 100/100/100**，全球访问 < 1s LCP，可作为性能标杆写在简历里。

## 2. 架构设计

### 2.1 部署架构

```
                          ┌──────────────────────┐
                          │    GitHub 数据源       │
                          │ mlg404/paldex-api     │
                          └──────────┬───────────┘
                                     │
                          ┌──────────▼───────────┐
                          │  sync-data.ts (CI)    │
                          │  定时同步 JSON + 图片  │
                          └──────────┬───────────┘
                                     │
┌─────────────────────────────────────┼──────────────────────────────┐
│                          ┌──────────▼───────────┐                 │
│                          │   Next.js Build       │                 │
│                          │   (SSG + ISR)         │                 │
│                          └──────────┬───────────┘                 │
│                                     │                             │
│                    ┌────────────────┼────────────────┐            │
│                    │                │                │            │
│              ┌─────▼─────┐   ┌──────▼──────┐  ┌─────▼─────┐      │
│              │ 静态页面   │   │ ISR 页面     │  │ API Routes│      │
│              │ /pals/*   │   │ /chat/*      │  │ /api/*    │      │
│              │ /breeding │   │ /map         │  │           │      │
│              └─────┬─────┘   └──────┬──────┘  └─────┬─────┘      │
│                    │                │                │            │
│              ┌─────▼────────────────▼────────────────▼─────┐      │
│              │           Vercel Edge Network               │      │
│              │         (全球 300+ 节点缓存)                 │      │
│              └─────────────────────────────────────────────┘      │
│                          Pal Universe Frontend                     │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 渲染策略

| 页面类型 | 策略 | 原因 |
|---------|------|------|
| 首页 | SSG (静态生成) | 内容固定，build 时生成 |
| 帕鲁列表 | SSG | 数据变更频率低 |
| 帕鲁详情 | SSG + ISR (revalidate: 1周) | 游戏更新后自动再生 |
| 繁殖计算器 | 客户端渲染 (CSR) | 交互密集型，输入决定输出 |
| AI Chat | SSR + Streaming | 需要服务端 LLM 调用 |
| 地图 | SSR (静态壳) + CSR (地图数据) | 地图引擎需要浏览器 API |
| 队伍构建器 | CSR | 纯客户端交互 |

### 2.3 缓存策略

| 层级 | 缓存内容 | TTL | 失效机制 |
|------|---------|-----|---------|
| CDN | 静态资源 (.js/.css/.png) | 1年 | 文件名 hash 变更 |
| CDN | HTML 页面 | 1周 | ISR revalidate |
| Edge | API 响应 | 5分钟 | 基于 cache tag |
| 浏览器 | 帕鲁 JSON 数据 | 1天 | Service Worker 控制 |
| 内存 | 热门查询 (AI Chat) | 1小时 | LRU 淘汰 (最多 100 条) |

## 3. 性能预算

| 资源 | 预算 | 超限处理 |
|------|------|---------|
| 总 JS 体积 (首屏) | < 150KB gzip | 代码分割 + 动态导入 |
| 总 CSS 体积 | < 30KB gzip | Tailwind CSS purge |
| 首图 | < 50KB (WebP) | next/image 自动优化 |
| 字体 | < 20KB | 仅加载 Latin + CJK 子集 |
| API payload (pals) | < 100KB | 分页/按需加载 |

## 4. SEO 与可访问性

- 所有页面 SSR/SSG，确保爬虫可抓取
- 语义化 HTML (article/nav/header/main/footer)
- 结构化数据 (JSON-LD) — 帕鲁数据以 Schema.org 格式输出
- sitemap.xml 自动生成
- RSS Feed（版本更新通知）
- 符合 WCAG 2.1 AA 标准

## 5. 验收标准

| ID | 标准 | 测试方式 |
|----|------|---------|
| AC-001 | Lighthouse Performance 100 | CI 中跑 Lighthouse CI |
| AC-002 | Lighthouse Accessibility 100 | CI 中跑 axe-core |
| AC-003 | Lighthouse Best Practices 100 | CI 中跑 Lighthouse CI |
| AC-004 | LCP < 1.0s (全球 P95) | Vercel Analytics |
| AC-005 | TBT < 50ms | Lighthouse CI |
| AC-006 | CLS < 0.1 | Lighthouse CI |
| AC-007 | 所有页面有 sitemap 条目 | 自动化检查 |
| AC-008 | 所有页面可通过键盘导航 | axe-core + 手动测试 |
