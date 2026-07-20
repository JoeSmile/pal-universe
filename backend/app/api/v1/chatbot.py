"""Chatbot API endpoints for handling chat interactions.

This module provides endpoints for chat interactions, including regular chat,
streaming chat, message history management, and chat history clearing.
"""

import json
import uuid

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
)
from fastapi.responses import StreamingResponse

from app.api.v1.auth import get_current_session
from app.core.config import settings
from app.core.langgraph.graph import LangGraphAgent
from app.core.limiter import limiter
from app.core.logging import logger
from app.core.metrics import llm_stream_duration_seconds
from app.models.session import Session
from app.schemas.chat import (
    ChatRequest,
    ChatRequestV2,
    ChatResponse,
    StreamResponse,
)
from app.services.session_naming import maybe_name_session

router = APIRouter()
agent = LangGraphAgent()


@router.post("/chat", response_model=ChatResponse)
@limiter.limit(settings.RATE_LIMIT_ENDPOINTS["chat"][0])
async def chat(
    request: Request,
    chat_request: ChatRequest,
):
    """Process a chat request using LangGraph.

    Args:
        request: The FastAPI request object for rate limiting.
        chat_request: The chat request containing messages.
        session: The current session from the auth token.

    Returns:
        ChatResponse: The processed chat response.

    Raises:
        HTTPException: If there's an error processing the request.
    """
    try:
        logger.info(
            "chat_request_received",
            thread_id="default",
            message_count=len(chat_request.messages),
        )

        if settings.SESSION_NAMING_ENABLED:
            maybe_name_session("default", "default", chat_request.messages)

        result = await agent.get_response(chat_request.messages, "default")

        logger.info("chat_request_processed", thread_id="default")

        return ChatResponse(messages=result)
    except Exception as e:
        logger.exception("chat_request_failed", thread_id="default", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat/stream")
@limiter.limit(settings.RATE_LIMIT_ENDPOINTS["chat_stream"][0])
async def chat_stream(
    request: Request,
    chat_request: ChatRequest,
):
    """Process a chat request using LangGraph with streaming response.

    Args:
        request: The FastAPI request object for rate limiting.
        chat_request: The chat request containing messages.
        session: The current session from the auth token.

    Returns:
        StreamingResponse: A streaming response of the chat completion.

    Raises:
        HTTPException: If there's an error processing the request.
    """
    try:
        logger.info(
            "stream_chat_request_received",
            thread_id="default",
            message_count=len(chat_request.messages),
        )

        if settings.SESSION_NAMING_ENABLED:
            maybe_name_session("default", "default", chat_request.messages)

        async def event_generator():
            """Generate streaming events.

            Yields:
                str: Server-sent events in JSON format.

            Raises:
                Exception: If there's an error during streaming.
            """
            try:
                with llm_stream_duration_seconds.labels(model=agent.llm_service.get_llm().get_name()).time():
                    async for chunk in agent.get_stream_response(chat_request.messages, "default"):
                        response = StreamResponse(content=chunk, done=False)
                        yield f"data: {json.dumps(response.model_dump(mode='json'))}\n\n"

                # Send final message indicating completion
                final_response = StreamResponse(content="", done=True)
                yield f"data: {json.dumps(final_response.model_dump(mode='json'))}\n\n"

            except Exception as e:
                logger.exception(
                    "stream_chat_request_failed",
                    thread_id="default",
                    error=str(e),
                )
                error_response = StreamResponse(content=str(e), done=True)
                yield f"data: {json.dumps(error_response.model_dump(mode='json'))}\n\n"

        return StreamingResponse(event_generator(), media_type="text/event-stream")

    except Exception as e:
        logger.exception(
            "stream_chat_request_failed",
            thread_id="default",
            error=str(e),
        )
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/messages", response_model=ChatResponse)
@limiter.limit(settings.RATE_LIMIT_ENDPOINTS["messages"][0])
async def get_session_messages(
    request: Request,
    session: Session = Depends(get_current_session),
):
    """Get all messages for a session.

    Args:
        request: The FastAPI request object for rate limiting.
        session: The current session from the auth token.

    Returns:
        ChatResponse: All messages in the session.

    Raises:
        HTTPException: If there's an error retrieving the messages.
    """
    try:
        messages = await agent.get_chat_history(session.id)
        return ChatResponse(messages=messages)
    except Exception as e:
        logger.exception("get_messages_failed", session_id=session.id, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/messages")
@limiter.limit(settings.RATE_LIMIT_ENDPOINTS["messages"][0])
async def clear_chat_history(
    request: Request,
    session: Session = Depends(get_current_session),
):
    """Clear all messages for a session.

    Args:
        request: The FastAPI request object for rate limiting.
        session: The current session from the auth token.

    Returns:
        dict: A message indicating the chat history was cleared.
    """
    try:
        await agent.clear_chat_history(session.id)
        return {"message": "Chat history cleared successfully"}
    except Exception as e:
        logger.exception("clear_chat_history_failed", session_id=session.id, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


# ─── V2 Chat endpoints (conversation_id protocol) ─────────────────────


@router.post("/chat/stream", summary="AI 聊天流式（V2 增量协议）")
@limiter.limit(settings.RATE_LIMIT_ENDPOINTS["chat"][0])
async def chat_stream_v2(
    request: Request,
    chat_request: ChatRequestV2,
    session: Session = Depends(get_current_session),
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
                user_id=str(session.user_id),
                username=session.username,
            ):
                if chunk:
                    full_response += chunk
                    yield f"event: chunk\ndata: {json.dumps({'content': chunk})}\n\n"

            # Record token usage (rough estimate: char count / 4)
            tokens_used = len(full_response) // 4

            # Inject token count into response for audit middleware
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
