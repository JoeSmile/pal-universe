"use client";

import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/locale";
import { useLocaleStore } from "@/lib/i18n/store";

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps): React.ReactElement {
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);
  const translate = useLocaleStore((state) => state.t);

  function select(next: Locale): void {
    setLocale(next);
  }

  return (
    <div
      className={cn("inline-flex items-center gap-1 rounded-lg border border-border p-1", className)}
      role="group"
      aria-label={translate("lang.switch")}
    >
      <button
        type="button"
        onClick={() => select("en")}
        className={cn(
          "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
          locale === "en"
            ? "bg-accent text-text-inverse"
            : "text-text-secondary hover:bg-bg-hover hover:text-text-primary",
        )}
        aria-pressed={locale === "en"}
      >
        {translate("lang.en")}
      </button>
      <button
        type="button"
        onClick={() => select("zh")}
        className={cn(
          "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
          locale === "zh"
            ? "bg-accent text-text-inverse"
            : "text-text-secondary hover:bg-bg-hover hover:text-text-primary",
        )}
        aria-pressed={locale === "zh"}
      >
        {translate("lang.zh")}
      </button>
    </div>
  );
}
