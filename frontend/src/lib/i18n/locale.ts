export type Locale = "en" | "zh";

export const LOCALES: Locale[] = ["en", "zh"];
export const DEFAULT_LOCALE: Locale = "zh";
export const LOCALE_STORAGE_KEY = "pal-universe.locale";

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "zh";
}
