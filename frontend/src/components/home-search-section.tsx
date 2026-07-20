"use client";

import { useEffect, useRef, useState } from "react";
import { ChatUsage } from "@/components/chat-usage";
import { HotPals } from "@/components/hot-pals";
import { QuickLinks } from "@/components/quick-links";
import { SearchBar } from "@/components/search-bar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ChatApiError, shouldUseMockChat, streamChat } from "@/lib/chat-api";
import { streamMockChat } from "@/lib/chat-mock";
import { useAuthStore } from "@/lib/auth-store";
import { useLocaleStore } from "@/lib/i18n/store";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function HomeSearchSection(): React.ReactElement {
  const translate = useLocaleStore((state) => state.t);
  const hydrate = useAuthStore((state) => state.hydrate);
  const authHeader = useAuthStore((state) => state.authHeader);
  const chatRemaining = useAuthStore((state) => state.chatRemaining);
  const recordChatUse = useAuthStore((state) => state.recordChatUse);
  const markChatExhausted = useAuthStore((state) => state.markChatExhausted);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const chatListRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Scroll only inside the chat panel — never the whole page.
  useEffect(() => {
    const list = chatListRef.current;
    if (!list) return;
    list.scrollTop = list.scrollHeight;
  }, [messages, isStreaming]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  async function handleAskAi(question: string): Promise<void> {
    if (chatRemaining() <= 0) {
      setMessages((prev) => [
        ...prev,
        {
          id: `limit-${Date.now()}`,
          role: "assistant",
          content: translate("auth.usageExhausted"),
        },
      ]);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: question,
    };
    const assistantId = `assistant-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      userMessage,
      { id: assistantId, role: "assistant", content: "" },
    ]);
    setIsStreaming(true);

    try {
      const stream = shouldUseMockChat()
        ? streamMockChat(question, { delayMs: 8, signal: controller.signal })
        : streamChat(question, {
            conversationId,
            headers: authHeader(),
            signal: controller.signal,
            onConversationId: (id) => setConversationId(id),
          });

      for await (const chunk of stream) {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId
              ? { ...message, content: `${message.content}${chunk}` }
              : message,
          ),
        );
      }
      recordChatUse();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      if (error instanceof ChatApiError && error.status === 429) {
        markChatExhausted();
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId
              ? { ...message, content: error.message || translate("auth.usageExhausted") }
              : message,
          ),
        );
        return;
      }
      // Live API unavailable → fall back to mock once so homepage still works offline.
      if (error instanceof ChatApiError || error instanceof TypeError) {
        try {
          for await (const chunk of streamMockChat(question, {
            delayMs: 8,
            signal: controller.signal,
          })) {
            setMessages((prev) =>
              prev.map((message) =>
                message.id === assistantId
                  ? { ...message, content: `${message.content}${chunk}` }
                  : message,
              ),
            );
          }
          recordChatUse();
          return;
        } catch (mockError) {
          if (mockError instanceof DOMException && mockError.name === "AbortError") {
            return;
          }
        }
      }
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId
            ? { ...message, content: translate("auth.chatFailed") }
            : message,
        ),
      );
    } finally {
      setIsStreaming(false);
    }
  }

  const showChat = messages.length > 0;

  return (
    <div className="flex min-h-screen flex-col bg-bg-base text-text-primary">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-10 md:gap-12 md:px-6 md:py-16">
        <header className="text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Pal Universe</h1>
          <p className="mt-3 text-base text-text-secondary md:text-lg">
            {translate("home.tagline")}
          </p>
        </header>

        <section
          data-testid="home-search-anchor"
          className="relative z-20 mx-auto flex w-full max-w-xl flex-col items-center"
        >
          <SearchBar className="w-full" onAskAi={(query) => void handleAskAi(query)} />
          <ChatUsage className="mt-1 w-full text-left" />

          {/* Overlay chat — sits over QuickLinks instead of pushing the page down. */}
          {showChat ? (
            <section
              aria-label="AI chat"
              className={cn(
                "absolute left-0 right-0 top-full z-20 mt-2 flex max-h-[min(50dvh,28rem)] flex-col",
                "rounded-xl border border-border bg-bg-surface p-4 shadow-xl shadow-black/25",
              )}
            >
              <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
                <h2 className="text-sm font-medium text-text-secondary">
                  {translate("home.chatTitle")}
                </h2>
                <div className="flex items-center gap-3">
                  <ChatUsage showAnonTip={false} />
                  <button
                    type="button"
                    onClick={() => {
                      abortRef.current?.abort();
                      setMessages([]);
                      setIsStreaming(false);
                    }}
                    className="text-xs text-text-secondary hover:text-text-primary"
                    data-testid="chat-close"
                  >
                    {translate("home.chatClose")}
                  </button>
                </div>
              </div>
              <ul
                ref={chatListRef}
                className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain"
              >
                {messages.map((message) => (
                  <li
                    key={message.id}
                    className={cn(
                      "max-w-[90%] shrink-0 rounded-2xl px-3 py-2 text-sm leading-relaxed",
                      "whitespace-pre-wrap break-words",
                      message.role === "user"
                        ? "ml-auto bg-accent text-text-inverse"
                        : "mr-auto bg-bg-elevated text-text-primary",
                    )}
                  >
                    {message.content || (isStreaming ? "…" : "")}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </section>

        <QuickLinks />
        <HotPals />
      </main>
      <SiteFooter />
    </div>
  );
}
