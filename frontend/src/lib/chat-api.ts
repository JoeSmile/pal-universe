import { apiUrl } from "@/lib/api/config";

export class ChatApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "ChatApiError";
  }
}

interface StreamChatOptions {
  conversationId?: string | null;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  onConversationId?: (id: string) => void;
}

/**
 * Stream assistant tokens from POST /api/v1/chatbot/chat/stream (SSE).
 * Yields content chunks; throws ChatApiError on HTTP/SSE errors.
 */
export async function* streamChat(
  message: string,
  options: StreamChatOptions = {},
): AsyncGenerator<string, void, void> {
  const res = await fetch(apiUrl("/api/v1/chatbot/chat/stream"), {
    method: "POST",
    headers: {
      Accept: "text/event-stream",
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: JSON.stringify({
      conversation_id: options.conversationId ?? null,
      message,
    }),
    signal: options.signal,
  });

  if (!res.ok) {
    let messageText = `Chat failed (${res.status})`;
    let code: string | undefined;
    try {
      const body = (await res.json()) as {
        detail?: string;
        error?: { code?: string; message?: string };
      };
      messageText = body.error?.message || body.detail || messageText;
      code = body.error?.code;
    } catch {
      // ignore parse errors
    }
    throw new ChatApiError(messageText, res.status, code);
  }

  if (!res.body) {
    throw new ChatApiError("Empty response body", res.status);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let eventName = "message";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n");
    buffer = parts.pop() ?? "";

    for (const line of parts) {
      const trimmed = line.replace(/\r$/, "");
      if (!trimmed) {
        eventName = "message";
        continue;
      }
      if (trimmed.startsWith("event:")) {
        eventName = trimmed.slice(6).trim();
        continue;
      }
      if (!trimmed.startsWith("data:")) continue;

      const data = trimmed.slice(5).trim();
      if (!data || data === "[DONE]") continue;

      let parsed: {
        content?: string;
        conversation_id?: string;
        code?: string;
        message?: string;
      };
      try {
        parsed = JSON.parse(data) as typeof parsed;
      } catch {
        continue;
      }

      if (eventName === "error") {
        throw new ChatApiError(
          parsed.message || "AI service unavailable",
          502,
          parsed.code,
        );
      }
      if (eventName === "done") {
        if (parsed.conversation_id) {
          options.onConversationId?.(parsed.conversation_id);
        }
        continue;
      }
      if (parsed.content) {
        yield parsed.content;
      }
    }
  }
}

/** Prefer live API; fall back to mock when NEXT_PUBLIC_USE_MOCK_CHAT=true. */
export function shouldUseMockChat(): boolean {
  return process.env.NEXT_PUBLIC_USE_MOCK_CHAT === "true";
}
