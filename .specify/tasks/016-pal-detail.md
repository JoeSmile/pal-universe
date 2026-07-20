# 016-pal-detail

## Status
- status: pending
- assigned_to: cursor
- depends_on: [006]

## Goal

创建帕鲁详情页 `/pals/{name}`，展示帕鲁完整信息：属性/技能/工作/掉落/位置/繁殖。

## Files
- Create: `frontend/src/app/pals/[name]/page.tsx`
- Create: `frontend/src/components/pal-detail.tsx`
- Create: `frontend/src/components/pal-detail.test.tsx`

## Acceptance Criteria

### 基本信息区
- [ ] 帕鲁大图（入场 spring 动画）
- [ ] 名称（双语）、元素徽章、稀有度星级、编号
- [ ] 属性数值条（HP/ATK/DEF/STAM/SPT）悬停展开详细

### 技能区
- [ ] 主动技能列表（名称/类型/威力/冷却）
- [ ] 伙伴技能展示
- [ ] 被动技能展示

### 数据区
- [ ] 工作适性（图标+等级点阵）
- [ ] 繁殖排名 + "查看繁殖路线" 链接
- [ ] 掉落物列表（名称+概率）
- [ ] 位置坐标 + "在地图中查看" 链接（Phase 2 可用）

### AI 集成
- [ ] 底部 "问 AI" 输入框，预填帕鲁名上下文
- [ ] 点击打开 Chat 时携带 "关于 Anubis" 上下文

### 数据来源
- `GET /api/v1/pals/{name}` → 帕鲁详情
- `GET /api/v1/pals/{name}/locations` → 位置数据（若详情无位置则后补）
- `src/data/pal-locations.json` → 位置 fallback

### 质量
- [ ] TypeScript type-check 通过
- [ ] 测试通过
- [ ] Build 通过
- [ ] 响应式（移动端单列）
