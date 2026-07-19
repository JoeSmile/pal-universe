"use client";

import Link from "next/link";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useLocaleStore } from "@/lib/i18n/store";

export function SiteHeader(): React.ReactElement {
  const translate = useLocaleStore((state) => state.t);

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-bg-base/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link href="/" className="text-sm font-semibold text-text-primary hover:text-accent">
          Pal Universe
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="hidden text-sm text-text-secondary hover:text-text-primary sm:inline"
          >
            {translate("nav.home")}
          </Link>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
