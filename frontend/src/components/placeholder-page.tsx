"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { useLocaleStore } from "@/lib/i18n/store";
import type { MessageKey } from "@/lib/i18n/messages";

interface PlaceholderPageProps {
  titleKey: MessageKey;
}

export function PlaceholderPage({ titleKey }: PlaceholderPageProps): React.ReactElement {
  const translate = useLocaleStore((state) => state.t);

  return (
    <div className="min-h-screen bg-bg-base text-text-primary">
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-16 md:px-6">
        <h1 className="text-3xl font-bold tracking-tight">{translate(titleKey)}</h1>
        <p className="text-text-secondary">{translate("placeholder.comingSoon")}</p>
        <Link href="/" className="text-sm text-accent hover:text-accent-hover">
          {translate("placeholder.backHome")}
        </Link>
      </div>
    </div>
  );
}
