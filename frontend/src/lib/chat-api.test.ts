import { describe, expect, it, vi } from "vitest";
import { ChatApiError, streamChat } from "@/lib/chat-api";

describe("streamChat", () => {
  it("yields SSE chunk content and forwards Bearer header", async () => {
    const sse = [
      "event: chunk\n",
      'data: {"content":"Hello"}\n\n',
      "event: chunk\n",
      'data: {"content":" world"}\n\n',
      "event: done\n",
      'data: {"conversation_id":"abc123"}\n\n',
    ].join("");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(sse));
          controller.close();
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const onConversationId = vi.fn();
    const chunks: string[] = [];
    for await (const chunk of streamChat("hi", {
      headers: { Authorization: "Bearer tok" },
      onConversationId,
    })) {
      chunks.push(chunk);
    }

    expect(chunks.join("")).toBe("Hello world");
    expect(onConversationId).toHaveBeenCalledWith("abc123");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/chatbot/chat/stream"),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer tok" }),
      }),
    );

    vi.unstubAllGlobals();
  });

  it("throws ChatApiError on HTTP failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: "额度用完", code: "RATE_LIMIT" } }),
      }),
    );

    await expect(async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _ of streamChat("hi")) {
        // drain
      }
    }).rejects.toMatchObject({ name: "ChatApiError", status: 429 } satisfies Partial<ChatApiError>);

    vi.unstubAllGlobals();
  });
});
