"use client";

import { create } from "zustand";
import {
  loginUser,
  registerUser,
  type AuthToken,
  type AuthUser,
} from "@/lib/api/auth";

const TOKEN_KEY = "auth_token";
const EXPIRES_KEY = "auth_expires_at";
const USER_KEY = "auth_user";
const USAGE_KEY = "auth_chat_usage";

export const ANON_CHAT_LIMIT = 5;
export const USER_CHAT_LIMIT = 50;

interface UsageState {
  date: string; // YYYY-MM-DD local
  count: number;
}

interface AuthState {
  token: string | null;
  expiresAt: string | null;
  user: AuthUser | null;
  hydrated: boolean;
  usageCount: number;
  /** True after hydrate cleared an expired token — prompt re-login. */
  sessionExpiredNotice: boolean;
  hydrate: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    email: string;
    password: string;
    username?: string;
  }) => Promise<void>;
  logout: () => void;
  clearSessionExpiredNotice: () => void;
  isAuthenticated: () => boolean;
  authHeader: () => Record<string, string>;
  chatLimit: () => number;
  chatRemaining: () => number;
  recordChatUse: () => void;
  markChatExhausted: () => void;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function readUsage(): UsageState {
  if (typeof window === "undefined") {
    return { date: todayKey(), count: 0 };
  }
  try {
    const raw = window.localStorage.getItem(USAGE_KEY);
    if (!raw) return { date: todayKey(), count: 0 };
    const parsed = JSON.parse(raw) as UsageState;
    if (parsed.date !== todayKey()) {
      return { date: todayKey(), count: 0 };
    }
    return { date: parsed.date, count: Number(parsed.count) || 0 };
  } catch {
    return { date: todayKey(), count: 0 };
  }
}

function writeUsage(usage: UsageState): void {
  try {
    window.localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
  } catch {
    // ignore
  }
}

function persistSession(token: AuthToken, user: AuthUser | null): void {
  try {
    window.localStorage.setItem(TOKEN_KEY, token.access_token);
    window.localStorage.setItem(EXPIRES_KEY, token.expires_at);
    if (user) {
      window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  } catch {
    // ignore
  }
}

function clearSession(): void {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(EXPIRES_KEY);
    window.localStorage.removeItem(USER_KEY);
  } catch {
    // ignore
  }
}

function readStoredUser(): AuthUser | null {
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  expiresAt: null,
  user: null,
  hydrated: false,
  usageCount: 0,
  sessionExpiredNotice: false,

  hydrate: () => {
    if (typeof window === "undefined") {
      set({ hydrated: true });
      return;
    }
    const token = window.localStorage.getItem(TOKEN_KEY);
    const expiresAt = window.localStorage.getItem(EXPIRES_KEY);
    const user = readStoredUser();
    const usage = readUsage();
    const expired =
      Boolean(token && expiresAt) && new Date(expiresAt!).getTime() <= Date.now();
    if (expired) {
      clearSession();
      set({
        token: null,
        expiresAt: null,
        user: null,
        usageCount: usage.count,
        sessionExpiredNotice: true,
        hydrated: true,
      });
      return;
    }
    set({
      token,
      expiresAt,
      user,
      usageCount: usage.count,
      sessionExpiredNotice: false,
      hydrated: true,
    });
  },

  login: async (email, password) => {
    const token = await loginUser({ email, password });
    const user: AuthUser = {
      id: 0,
      email: email.trim(),
      username: email.trim().split("@")[0] ?? email.trim(),
    };
    persistSession(token, user);
    set({
      token: token.access_token,
      expiresAt: token.expires_at,
      user,
      sessionExpiredNotice: false,
    });
  },

  register: async (input) => {
    const { user, token } = await registerUser(input);
    persistSession(token, user);
    set({
      token: token.access_token,
      expiresAt: token.expires_at,
      user,
      sessionExpiredNotice: false,
    });
  },

  logout: () => {
    clearSession();
    set({
      token: null,
      expiresAt: null,
      user: null,
      sessionExpiredNotice: false,
    });
  },

  clearSessionExpiredNotice: () => set({ sessionExpiredNotice: false }),

  isAuthenticated: () => {
    const { token, expiresAt } = get();
    if (!token || !expiresAt) return false;
    return new Date(expiresAt).getTime() > Date.now();
  },

  authHeader: () => {
    if (!get().isAuthenticated()) return {} as Record<string, string>;
    return { Authorization: `Bearer ${get().token}` };
  },

  chatLimit: () => (get().isAuthenticated() ? USER_CHAT_LIMIT : ANON_CHAT_LIMIT),

  chatRemaining: () => {
    const limit = get().chatLimit();
    return Math.max(0, limit - get().usageCount);
  },

  recordChatUse: () => {
    const usage = readUsage();
    const next = { date: todayKey(), count: usage.count + 1 };
    writeUsage(next);
    set({ usageCount: next.count });
  },

  markChatExhausted: () => {
    const limit = get().chatLimit();
    const next = { date: todayKey(), count: limit };
    writeUsage(next);
    set({ usageCount: limit });
  },
}));
