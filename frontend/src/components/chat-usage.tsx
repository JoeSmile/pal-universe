"use client";

import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { useLocaleStore } from "@/lib/i18n/store";
import { cn } from "@/lib/utils";

interface ChatUsageProps {
  className?: string;
  /** Show anonymous upgrade tip below the counter. */
  showAnonTip?: boolean;
}

export function ChatUsage({
  className,
  showAnonTip = true,
}: ChatUsageProps): React.ReactElement {
  const translate = useLocaleStore((state) => state.t);
  const hydrated = useAuthStore((state) => state.hydrated);
  const usageCount = useAuthStore((state) => state.usageCount);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const chatLimit = useAuthStore((state) => state.chatLimit);
  const loggedIn = isAuthenticated();
  const limit = chatLimit();
  const remaining = Math.max(0, limit - usageCount);

  if (!hydrated) {
    return (
      <div className={cn("text-xs text-text-secondary", className)} aria-hidden>
        …
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1 text-xs text-text-secondary", className)}>
      <p data-testid="chat-usage">
        {translate("auth.usageRemaining")
          .replace("{remaining}", String(remaining))
          .replace("{limit}", String(limit))}
      </p>
      {showAnonTip && !loggedIn ? (
        <p data-testid="chat-anon-tip">
          {translate("auth.anonTip")}{" "}
          <Link href="/auth/register" className="text-accent hover:underline">
            {translate("auth.registerLink")}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
