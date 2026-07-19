"use client";

import { create } from "zustand";
import { DEFAULT_LOCALE, isLocale, LOCALE_STORAGE_KEY, type Locale } from "@/lib/i18n/locale";
import { t, type MessageKey } from "@/lib/i18n/messages";

interface LocaleState {
  locale: Locale;
  hydrated: boolean;
  setLocale: (locale: Locale) => void;
  hydrate: () => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
}

function readStoredLocale(): Locale {
  if (typeof window === "undefined") {
    return DEFAULT_LOCALE;
  }
  try {
    const raw = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(raw)) {
      return raw;
    }
  } catch {
    // ignore storage errors
  }
  return DEFAULT_LOCALE;
}

export const useLocaleStore = create<LocaleState>((set, get) => ({
  locale: DEFAULT_LOCALE,
  hydrated: false,
  setLocale: (locale) => {
    set({ locale });
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    }
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      // ignore
    }
  },
  hydrate: () => {
    const locale = readStoredLocale();
    set({ locale, hydrated: true });
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
    }
  },
  t: (key, vars) => t(get().locale, key, vars),
}));
