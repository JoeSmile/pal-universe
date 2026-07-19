# 005-home-search

## Status
- status: completed
- assigned_to: cursor
- depends_on: []
- completed_at: 2026-07-19

## Goal

在首页 C 位放置搜索框，支持中英文名搜索帕鲁，搜索结果以列表展示（卡牌 UI 见 `006-pal-card`）。

## Files
- Create: `frontend/src/components/search-bar.tsx`
- Create: `frontend/src/components/search-bar.test.tsx`
- Modify: `frontend/src/app/page.tsx`

## Acceptance Criteria
- [x] 搜索框位于首页上半部分，占 1/3 屏视觉权重
- [x] 输入 2 字符后开始搜索，500ms 内展示结果
- [x] 搜索结果同时显示中文名和英文名（如 "Anubis · 阿努比斯"）
- [x] 搜索框有清除按钮和 loading 态
- [x] 移动端搜索框在 thumb zone（底部 1/3 区域）
- [x] 测试通过
- [x] 中文名以 palworld.gg 为准，无撞名（数据完整性测试）

## Implementation Hints
- 搜索数据先用静态 JSON 列表（name + name_cn 映射），Phase 2 再接入后端搜索
- 帕鲁中文名映射放在 `frontend/src/data/pal-names.json`，用 `scripts/generate_pal_names.py` 从 https://palworld.gg/zh-Hans/pals?sort=index 生成
- 使用 Framer Motion 做搜索结果入场动画
- 搜索框样式参考 Linear.app 的 command palette 风格
- 引用 `docs/design/TOKENS.md` 的颜色和间距 Token
