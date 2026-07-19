"use client";

import { useEffect, useRef, useState } from "react";
import { HotPals } from "@/components/hot-pals";
import { QuickLinks } from "@/components/quick-links";
import { SearchBar } from "@/components/search-bar";
import { streamMockChat } from "@/lib/chat-mock";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function HomeSearchSection(): React.ReactElement {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isStreaming]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  async function handleAskAi(question: string): Promise<void> {
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
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantId
            ? { ...message, content: "回答生成失败，请再试一次。" }
            : message,
        ),
      );
    } finally {
      setIsStreaming(false);
    }
  }

  const showChat = messages.length > 0;

  return (
    <main className="min-h-screen bg-bg-base text-text-primary">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-10 md:gap-12 md:px-6 md:py-16">
        <header className="text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Pal Universe</h1>
          <p className="mt-3 text-base text-text-secondary md:text-lg">
            智能搜索 · AI 攻略 · 帕鲁百科
          </p>
        </header>

        <section
          data-testid="home-search-anchor"
          className="mx-auto flex w-full max-w-xl flex-col items-center"
        >
          <SearchBar className="w-full" onAskAi={(query) => void handleAskAi(query)} />
        </section>

        {showChat ? (
          <section
            aria-label="AI 对话"
            className="mx-auto w-full max-w-xl rounded-xl border border-border bg-bg-surface p-4"
          >
            <h2 className="mb-3 text-sm font-medium text-text-secondary">AI 助手（mock）</h2>
            <ul className="flex max-h-[40vh] flex-col gap-3 overflow-y-auto">
              {messages.map((message) => (
                <li
                  key={message.id}
                  className={cn(
                    "max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                    message.role === "user"
                      ? "ml-auto bg-accent text-text-inverse"
                      : "mr-auto bg-bg-elevated text-text-primary",
                  )}
                >
                  {message.content || (isStreaming ? "…" : "")}
                </li>
              ))}
              <div ref={chatEndRef} />
            </ul>
          </section>
        ) : null}

        <QuickLinks />
        <HotPals />
      </div>
    </main>
  );
}
