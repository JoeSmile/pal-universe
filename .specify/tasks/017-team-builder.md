# 017-team-builder

## Status
- status: pending
- assigned_to: cursor
- depends_on: [005]

## Goal

创建队伍搭配页面，替代首页入口的"属性克制"。用户选择 5 只帕鲁后分析属性覆盖度、工作覆盖度、AI 建议。

## Files
- Create: `frontend/src/app/team-builder/page.tsx`
- Create: `frontend/src/app/types/page.tsx` → 保留属性克制表
- Modify: `frontend/src/components/quick-links.tsx`（属性克制 → 队伍搭配）
- Create: `frontend/src/components/team-builder.test.tsx`

## Acceptance Criteria

### 队伍编辑
- [ ] 5 个槽位，点击弹出帕鲁选择器
- [ ] 每个槽位显示帕鲁卡牌缩略图
- [ ] 空槽位显示 "+添加" 占位
- [ ] 点击已选槽位可移除帕鲁

### 分析面板
- [ ] 属性覆盖度（9 种属性已覆盖/缺失）
- [ ] 工作适性覆盖度（12 种工作已覆盖/缺失）
- [ ] 属性短板检测（被哪些类型克制）
- [ ] AI 建议按钮 → 将队伍数据作为上下文发送到 Chat

### 数据来源
- 属性克制: `src/data/type-chart.json`
- 帕鲁数据: `src/data/pals.json` + API
- AI 建议: `POST /chat/stream` 带队伍上下文

### 首页入口
- [ ] quick-links.tsx 中 "属性克制" → "队伍搭配"
- [ ] 图标: LuFlame → LuSwords
- [ ] 路径: /types → /team-builder
- [ ] /types 页面保留，独立访问

### 质量
- [ ] TypeScript type-check 通过
- [ ] 测试通过
- [ ] Build 通过
