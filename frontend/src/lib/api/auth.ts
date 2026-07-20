import { apiUrl } from "@/lib/api/config";

export interface AuthToken {
  access_token: string;
  token_type: string;
  expires_at: string;
}

export interface AuthUser {
  id: number;
  email: string;
  username: string | null;
}

export class AuthApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "AuthApiError";
  }
}

type ErrorBody = {
  detail?: string | { msg?: string; message?: string }[];
  error?: { code?: string; message?: string };
};

function parseErrorMessage(payload: ErrorBody, fallback: string): string {
  if (typeof payload.detail === "string" && payload.detail) {
    return payload.detail;
  }
  if (Array.isArray(payload.detail) && payload.detail[0]) {
    const first = payload.detail[0];
    return first.msg || first.message || fallback;
  }
  if (payload.error?.message) {
    return payload.error.message;
  }
  return fallback;
}

/** POST /api/v1/auth/register — JSON body */
export async function registerUser(input: {
  email: string;
  password: string;
  username?: string;
}): Promise<{ user: AuthUser; token: AuthToken }> {
  const res = await fetch(apiUrl("/api/v1/auth/register"), {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      email: input.email.trim(),
      password: input.password,
      username: input.username?.trim() || null,
    }),
  });

  const payload = (await res.json().catch(() => ({}))) as ErrorBody & {
    id?: number;
    email?: string;
    username?: string | null;
    token?: AuthToken;
  };

  if (!res.ok || !payload.token?.access_token) {
    throw new AuthApiError(
      parseErrorMessage(payload, `Register failed (${res.status})`),
      res.status,
      payload.error?.code,
    );
  }

  return {
    user: {
      id: Number(payload.id),
      email: String(payload.email ?? input.email),
      username: payload.username ?? null,
    },
    token: payload.token,
  };
}

/** POST /api/v1/auth/login — form-urlencoded */
export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<AuthToken> {
  const body = new URLSearchParams();
  body.set("email", input.email.trim());
  body.set("password", input.password);
  body.set("grant_type", "password");

  const res = await fetch(apiUrl("/api/v1/auth/login"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const payload = (await res.json().catch(() => ({}))) as ErrorBody & AuthToken;

  if (!res.ok || !payload.access_token) {
    throw new AuthApiError(
      parseErrorMessage(payload, `Login failed (${res.status})`),
      res.status,
      payload.error?.code,
    );
  }

  return {
    access_token: payload.access_token,
    token_type: payload.token_type || "bearer",
    expires_at: payload.expires_at,
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

/** Match backend password rules (min 8 + upper/lower/digit/special). */
export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return "password.tooShort";
  }
  if (!/[A-Z]/.test(password)) {
    return "password.needUpper";
  }
  if (!/[a-z]/.test(password)) {
    return "password.needLower";
  }
  if (!/[0-9]/.test(password)) {
    return "password.needDigit";
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return "password.needSpecial";
  }
  return null;
}
