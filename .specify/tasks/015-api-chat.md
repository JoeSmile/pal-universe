# 015-api-chat

## Status
- status: pending
- assigned_to: hermes
- depends_on: [012, 014]

## Goal

改造 Chat API 为增量 conversation_id 协议（方案B）。

## Files
- Modify: `backend/app/api/v1/chatbot.py`

## Acceptance Criteria
- [ ] `POST /api/v1/chat/stream` 接受 `{conversation_id, message}` 格式
- [ ] 首次请求 conversation_id=null → 后端创建新 ID
- [ ] 后续请求带 conversation_id → 继续之前会话
- [ ] 历史超过 20 轮自动截断
- [ ] SSE 流式响应正常
- [ ] ruff check 通过
