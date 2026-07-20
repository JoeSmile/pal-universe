"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { useLocaleStore } from "@/lib/i18n/store";

function ChatBody(): React.ReactElement {
  const translate = useLocaleStore((state) => state.t);
  const searchParams = useSearchParams();
  const q = searchParams.get("q")?.trim() ?? "";
  const pal = searchParams.get("pal")?.trim() ?? "";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-10 md:px-6">
      <h1 className="text-3xl font-bold tracking-tight">{translate("chat.title")}</h1>
      {q ? (
        <div
          className="rounded-2xl border border-border bg-bg-surface p-4"
          data-testid="chat-prefill"
        >
          {pal ? (
            <p className="mb-2 text-xs uppercase tracking-wide text-text-secondary">
              {pal}
            </p>
          ) : null}
          <p className="text-text-primary">{q}</p>
        </div>
      ) : (
        <p className="text-text-secondary">{translate("chat.empty")}</p>
      )}
      <p className="text-sm text-text-secondary">{translate("placeholder.comingSoon")}</p>
      <Link href={pal ? `/pals/${encodeURIComponent(pal)}` : "/pals"} className="text-sm text-accent hover:underline">
        {translate("detail.backToList")}
      </Link>
    </div>
  );
}

export default function ChatPage(): React.ReactElement {
  return (
    <div className="min-h-dvh bg-bg-base text-text-primary">
      <SiteHeader />
      <Suspense fallback={null}>
        <ChatBody />
      </Suspense>
    </div>
  );
}
