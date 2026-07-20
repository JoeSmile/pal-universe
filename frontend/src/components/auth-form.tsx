"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthApiError, isValidEmail, validatePassword } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/auth-store";
import { useLocaleStore } from "@/lib/i18n/store";
import type { MessageKey } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

export type AuthFormMode = "login" | "register";

interface AuthFormProps {
  mode: AuthFormMode;
  className?: string;
}

export function AuthForm({ mode, className }: AuthFormProps): React.ReactElement {
  const router = useRouter();
  const translate = useLocaleStore((state) => state.t);
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function mapPasswordKey(key: string | null): string | null {
    if (!key) return null;
    return translate(key as MessageKey);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);

    if (!isValidEmail(email)) {
      setError(translate("auth.error.emailInvalid"));
      return;
    }

    if (mode === "register") {
      const pwdError = mapPasswordKey(validatePassword(password));
      if (pwdError) {
        setError(pwdError);
        return;
      }
      if (password !== confirmPassword) {
        setError(translate("auth.error.passwordMismatch"));
        return;
      }
    } else if (password.length < 6) {
      setError(translate("auth.error.passwordTooShort"));
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register({
          email,
          password,
          username: username.trim() || undefined,
        });
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      if (err instanceof AuthApiError) {
        if (err.status === 409 || /already|exist/i.test(err.message)) {
          setError(translate("auth.error.emailExists"));
        } else if (err.status === 401 || /credential|password|incorrect/i.test(err.message)) {
          setError(translate("auth.error.badCredentials"));
        } else {
          setError(err.message || translate("auth.error.generic"));
        }
      } else {
        setError(translate("auth.error.generic"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  const title = mode === "login" ? translate("auth.loginTitle") : translate("auth.registerTitle");
  const submitLabel =
    mode === "login" ? translate("auth.loginSubmit") : translate("auth.registerSubmit");
  const switchHref = mode === "login" ? "/auth/register" : "/auth/login";
  const switchLabel =
    mode === "login" ? translate("auth.goRegister") : translate("auth.goLogin");

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className={cn(
        "mx-auto w-full max-w-md rounded-xl border border-border bg-bg-surface p-6 shadow-sm",
        className,
      )}
      noValidate
    >
      <h1 className="text-2xl font-semibold tracking-tight text-text-primary">{title}</h1>

      <div className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-text-secondary">{translate("auth.email")}</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-border bg-bg-base px-3 py-2 text-text-primary outline-none focus:border-accent"
            required
          />
        </label>

        {mode === "register" ? (
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-text-secondary">{translate("auth.username")}</span>
            <input
              type="text"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="rounded-lg border border-border bg-bg-base px-3 py-2 text-text-primary outline-none focus:border-accent"
              maxLength={50}
            />
          </label>
        ) : null}

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-text-secondary">{translate("auth.password")}</span>
          <input
            type="password"
            name="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-border bg-bg-base px-3 py-2 text-text-primary outline-none focus:border-accent"
            required
          />
        </label>

        {mode === "register" ? (
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-text-secondary">{translate("auth.confirmPassword")}</span>
            <input
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="rounded-lg border border-border bg-bg-base px-3 py-2 text-text-primary outline-none focus:border-accent"
              required
            />
          </label>
        ) : null}

        {mode === "register" ? (
          <p className="text-xs text-text-secondary">{translate("auth.passwordHint")}</p>
        ) : null}

        {error ? (
          <p role="alert" className="text-sm text-red-500">
            {error}
          </p>
        ) : null}

        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-text-inverse hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? translate("auth.submitting") : submitLabel}
          </button>
          <Link href={switchHref} className="text-sm text-accent hover:underline">
            {switchLabel}
          </Link>
        </div>
      </div>
    </form>
  );
}
