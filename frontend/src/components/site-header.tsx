"use client";

import Link from "next/link";
import { useEffect } from "react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useAuthStore } from "@/lib/auth-store";
import { useLocaleStore } from "@/lib/i18n/store";

export function SiteHeader(): React.ReactElement {
  const translate = useLocaleStore((state) => state.t);
  const hydrate = useAuthStore((state) => state.hydrate);
  const hydrated = useAuthStore((state) => state.hydrated);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const sessionExpiredNotice = useAuthStore((state) => state.sessionExpiredNotice);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const loggedIn = hydrated && isAuthenticated();
  const displayName =
    user?.username?.trim() ||
    user?.email?.split("@")[0] ||
    translate("auth.user");

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
          {hydrated ? (
            loggedIn ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="hidden text-text-secondary sm:inline" data-testid="auth-username">
                  {displayName}
                </span>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="text-text-secondary hover:text-text-primary"
                  data-testid="auth-logout"
                >
                  {translate("auth.logout")}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                {sessionExpiredNotice ? (
                  <span
                    className="hidden text-xs text-amber-600 md:inline dark:text-amber-400"
                    data-testid="auth-session-expired"
                  >
                    {translate("auth.sessionExpired")}
                  </span>
                ) : null}
                <Link
                  href="/auth/login"
                  className="text-text-secondary hover:text-text-primary"
                  data-testid="auth-login-link"
                >
                  {translate("auth.login")}
                </Link>
                <Link
                  href="/auth/register"
                  className="rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-text-inverse hover:opacity-90"
                  data-testid="auth-register-link"
                >
                  {translate("auth.register")}
                </Link>
              </div>
            )
          ) : null}
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
