# Pal Universe 功能规格

> 来源: docs/PRD-000-PROJECT-OVERVIEW.md + docs/epics/PRD-001..007  
> 本文件是 spec-kit 的 spec.md，供 AI Agent 阅读以理解要构建什么。

---

## 1. 一句话描述

Palworld 的超级百科——比游戏本身还精致的帕鲁数据库，搭载 AI 聊天助手。

## 2. 目标用户

- **核心用户**：Palworld 活跃玩家，查数据、规划繁殖路线
- **进阶用户**：追求完美帕鲁配种、极限配队的硬核玩家
- **新玩家**：刚入手游戏，需要引导的萌新

## 3. 功能矩阵

### P0（必须，Phase 1）

| 功能 | 描述 | 验收标准 |
|------|------|---------|
| 帕鲁图鉴 | 299 只帕鲁的完整列表+详情，含属性和技能 | ✅ 已完成 |
| 帕鲁卡牌系统 | TCG 级交互卡片，悬停动效、属性对比 | ⬜ AC: 60fps 动画 |
| AI 聊天助手 | 自然语言查询帕鲁/繁殖/配队/位置（conversation_id 协议） | ⬜ AC: 首 token < 500ms |
| 繁殖计算器 | 父代→子代/子代→父代 | ✅ 后端已完成 |
| 极速搜索 | 按名称(中英)/类型/工作筛选帕鲁 | ✅ 后端已完成 |
| 聊天流式响应 | SSE 打字机效果 | ⬜ AC: 逐字输出 |
| 移动端适配 | 手机/平板/桌面响应式 | ⬜ AC: 三端可用 |
| 国内服务器部署 | 腾讯云 4G ¥100-150/月 | ⬜ AC: 备案后上线 |

### P1（重要，Phase 2）

| 功能 | 描述 |
|------|------|
| 超聚合互动地图 | 四层叠加（帕鲁/资源/Boss/传送） |
| 队伍构建器 | 拖拽组队 + 属性克制分析 |
| 暗黑主题视觉 | 暗紫+琥珀金+青蓝配色体系 |
| 性能优化 | CDN + 缓存预热 |

### 不做的范围

- ❌ 用户系统（登录/收藏/历史/自定义）
- ❌ 国际化（仅中英文，不拓展）
- ❌ 游戏 Mod/PvP/多人在线/商业化
- ❌ 语音交互
- ❌ PWA

## 4. 核心差异化

1. **AI 聊天助手** — 竞品（paldb.cc、palworld.gg）都没有
2. **TCG 卡牌 UI** — 不是表格，是交互式卡牌
3. **繁殖计算** — 后端已实现 rank 公式 + 特殊组合
4. **自动化飞轮** — spec-kit → Cursor → Hermes 验证 → Merge
5. **中文优先** — 所有竞品都是英文

## 5. 数据模型

### pals 表
```
name: string          ← 英文名 (Anubis)
name_cn: string       ← 中文名 (冥王犬)  
elements: string[]    ← [Ground]
deck_id: string       ← "1", "41B" (含字母编号)
rarity: int           ← 1-5
size: string          ← XS/S/M/L
data: JSONB           ← 完整帕鲁数据（含 breeding_rank, stats, skills, drops 等）
image: string         ← /images/pals/{name}.webp
```

### breeding 表
```
parent1: string       ← 父代1
parent2: string       ← 父代2
child: string         ← 子代
is_special: bool      ← 特殊组合（不遵循 rank 公式）
```

### Chat 协议
```
POST /chat/stream
{ "conversation_id": null | "abc123", "message": "..." }

SSE 响应:
event: chunk    → {"content": "Anubis"}
event: done     → {"conversation_id": "abc123", "tokens_used": 156}
```

## 6. 外部依赖

| 依赖 | 用途 | 类型 |
|------|------|------|
| DeepSeek API | LLM 推理 | API Key |
| palworld-kb（本地） | 结构化数据 | 文件 |
| pgvector/pgvector:pg16 | 向量数据库 | Docker |
| Redis Stack | 语义缓存 + KV | Docker |
| 腾讯云 Lighthouse | 国内服务器 | ¥100-150/月 |
