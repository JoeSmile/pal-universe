# 010-ai-chat-frontend

## Status
- status: pending
- assigned_to: cursor
- depends_on: []

## Goal

创建 AI 聊天前端组件，包含聊天 UI、SSE 流式连接、对话历史、帕鲁名链接跳转。

## Files
- Create: `frontend/src/app/chat/page.tsx`
- Create: `frontend/src/components/chat-window.tsx`
- Create: `frontend/src/components/chat-message.tsx`
- Create: `frontend/src/components/chat-input.tsx`
- Create: `frontend/src/stores/chat-store.ts`
- Create: `frontend/src/components/chat-window.test.tsx`

## Acceptance Criteria
- [ ] 聊天 UI 在首页占 1/3 屏，可直接输入问题
- [ ] SSE 流式响应展示打字机效果
- [ ] AI 回答中帕鲁名可点击跳转到详情
- [ ] 对话历史在 localStorage 持久化
- [ ] 快捷问题建议（"怎么繁殖 Anubis"、"哪些帕鲁适合挖矿"）
- [ ] loading 态、error 态、空态覆盖
- [ ] 移动端适配（底部固定输入框）
- [ ] 测试通过

## Implementation Hints
- 先实现纯前端 mock 模式（不连后端也能看效果），用 `MOCK_CHAT=true` 环境变量切换
- SSE 使用 `fetch` + `ReadableStream` 实现，不需要额外库
- 聊天框支持 Enter 发送、Shift+Enter 换行
- 消息组件用 react-markdown 渲染（package.json 已有）
- 对话存储用 Zustand + localStorage persist
- 参考 PRD-002 的聊天 UI 设计图
