# 016-pal-detail

## Status
- status: completed
- assigned_to: cursor
- depends_on: [006]
- started_at: 2026-07-20
- completed_at: 2026-07-20

## Goal

创建帕鲁详情页 `/pals/{name}`，展示帕鲁完整信息：属性/技能/工作/掉落/位置/繁殖。

## Files
- Create: `frontend/src/app/pals/[name]/page.tsx`
- Create: `frontend/src/components/pal-detail.tsx`
- Create: `frontend/src/components/pal-detail.test.tsx`
- Create: `frontend/src/lib/api/pal-detail.ts`
- Create: `frontend/src/lib/api/pal-detail.test.ts`
- Create: `frontend/src/app/chat/page.tsx`
- Modify: `frontend/src/components/pal-card.tsx` (link to detail)
- Modify: `frontend/src/lib/i18n/messages.ts`
- Modify: `backend/app/api/v1/pals.py` (locations path)

## Acceptance Criteria

### 基本信息区
- [x] Hero 区：大图（300x300）+ 基本信息（名称/元素/稀有度/编号/体形/伙伴技能）
- [x] 辅助信息：夜间活动/售价/移动速度
- [x] 大图入场 spring 动画，悬停 scale(1.05)

### 属性区
- [x] 6 条属性以进度条展示（从 0 动画填充到当前值）
- [x] 数值/最大值 显示在右侧
- [x] 色值按比例渐变（低值→红，中值→黄，高值→绿）

### 技能区
- [x] 主动技能表格（名称/属性/威力/冷却/效果）
- [x] 默认展示前 3 行，其余折叠 + "查看全部 N 个" 展开按钮
- [x] 伙伴技能独立展示

### 数据区
- [x] 工作适性：图标+等级点阵 2 列网格
- [x] 繁殖排名 + 颜色标识（<500=稀有红, >2000=常见蓝）
- [x] "查看繁殖路线" 链接跳转到 `/breeding?target=Anubis`
- [x] 掉落物列表（名称+概率+用途），100% 掉落高亮
- [x] 位置信息（区域/坐标/等级范围/刷新点数）

### AI 集成
- [x] 底部 AI Chat 输入框，预填 "关于 Anubis: " 上下文
- [x] 发送后跳转到 Chat 页面，携带帕鲁上下文

### 数据来源
- `GET /api/v1/pals/{name}` → 帕鲁详情
- `GET /api/v1/pals/{name}/locations` → 位置数据（若详情无位置则后补）
- `src/data/pal-locations.json` → 位置 fallback

### 质量
- [x] TypeScript type-check 通过
- [x] 测试通过
- [x] Build 通过
- [x] 响应式（移动端单列）
