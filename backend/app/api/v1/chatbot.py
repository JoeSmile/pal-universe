"""Chatbot API endpoints for handling chat interactions."""

import json
import uuid

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

from app.core.config import settings
from app.core.langgraph.graph import LangGraphAgent
from app.core.limiter import limiter
from app.core.logging import logger
from app.schemas.chat import ChatRequestV2, ChatResponse

router = APIRouter()

agent = LangGraphAgent()


# ─── Chat streaming ──────────────────────────────


@router.post("/chat/stream")
@limiter.limit(settings.RATE_LIMIT_ENDPOINTS["chat"][0])
async def chat_stream(
    request: Request,
    chat_request: ChatRequestV2,
):
    """Streaming chat with conversation_id protocol.

    Request:
        {"conversation_id": null, "message": "怎么繁殖Anubis?"}
        {"conversation_id": "abc123", "message": "那Jetragon呢?"}

    Returns SSE stream with:
        event: chunk    {"content": "Anubis..."}
        event: done     {"conversation_id": "abc123"}
    """
    cid = chat_request.conversation_id or uuid.uuid4().hex[:12]
    thread_id = cid

    async def event_stream():
        full_response = ""
        try:
            from app.schemas.chat import Message

            msg = Message(role="user", content=chat_request.message)
            async for chunk in agent.get_stream_response(
                messages=[msg],
                session_id=thread_id,
            ):
                if chunk:
                    full_response += chunk
                    yield f"event: chunk\ndata: {json.dumps({'content': chunk})}\n\n"

            tokens_used = len(full_response) // 4
            yield f"event: done\ndata: {json.dumps({'conversation_id': cid, 'tokens_used': tokens_used})}\n\n"
            logger.info("chat_stream_completed", conversation_id=cid, tokens=tokens_used)

        except Exception as e:
            logger.error("chat_stream_error", conversation_id=cid, error=str(e))
            yield f"event: error\ndata: {json.dumps({'code': 'LLM_GATEWAY_ERROR', 'message': 'AI 服务暂时不可用'})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "X-Conversation-Id": cid,
        },
    )


# ─── Chat history management ─────────────────────


@router.get("/messages", response_model=ChatResponse)
async def get_session_messages(
    request: Request,
    session_id: str = "default",
):
    """Get all messages for a session."""
    try:
        messages = await agent.get_chat_history(session_id)
        return ChatResponse(messages=messages)
    except Exception as e:
        logger.exception("get_messages_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.delete("/messages")
async def clear_chat_history(
    request: Request,
    session_id: str = "default",
):
    """Clear all messages for a session."""
    try:
        await agent.clear_chat_history(session_id)
        return {"status": "ok", "message": "Chat history cleared"}
    except Exception as e:
        logger.exception("clear_chat_history_failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e)) from e
