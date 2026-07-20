import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ANON_CHAT_LIMIT,
  USER_CHAT_LIMIT,
  useAuthStore,
} from "@/lib/auth-store";

vi.mock("@/lib/api/auth", () => ({
  loginUser: vi.fn(async () => ({
    access_token: "login-token",
    token_type: "bearer",
    expires_at: "2099-01-01T00:00:00.000Z",
  })),
  registerUser: vi.fn(async () => ({
    user: { id: 1, email: "new@ex.com", username: "newbie" },
    token: {
      access_token: "reg-token",
      token_type: "bearer",
      expires_at: "2099-01-01T00:00:00.000Z",
    },
  })),
}));

describe("useAuthStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      token: null,
      expiresAt: null,
      user: null,
      hydrated: false,
      usageCount: 0,
      sessionExpiredNotice: false,
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("persists token under auth_token on login", async () => {
    await useAuthStore.getState().login("user@ex.com", "GoodPass1!");
    expect(localStorage.getItem("auth_token")).toBe("login-token");
    expect(useAuthStore.getState().isAuthenticated()).toBe(true);
    expect(useAuthStore.getState().authHeader()).toEqual({
      Authorization: "Bearer login-token",
    });
    expect(useAuthStore.getState().chatLimit()).toBe(USER_CHAT_LIMIT);
  });

  it("register auto-logs in and stores token", async () => {
    await useAuthStore.getState().register({
      email: "new@ex.com",
      password: "GoodPass1!",
      username: "newbie",
    });
    expect(localStorage.getItem("auth_token")).toBe("reg-token");
    expect(useAuthStore.getState().user?.username).toBe("newbie");
  });

  it("logout clears token", async () => {
    await useAuthStore.getState().login("user@ex.com", "GoodPass1!");
    useAuthStore.getState().logout();
    expect(localStorage.getItem("auth_token")).toBeNull();
    expect(useAuthStore.getState().isAuthenticated()).toBe(false);
    expect(useAuthStore.getState().chatLimit()).toBe(ANON_CHAT_LIMIT);
  });

  it("hydrate clears expired token and sets notice", () => {
    localStorage.setItem("auth_token", "old");
    localStorage.setItem("auth_expires_at", "2000-01-01T00:00:00.000Z");
    useAuthStore.getState().hydrate();
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().sessionExpiredNotice).toBe(true);
  });

  it("tracks anonymous chat usage against daily limit", () => {
    useAuthStore.getState().hydrate();
    expect(useAuthStore.getState().chatRemaining()).toBe(ANON_CHAT_LIMIT);
    useAuthStore.getState().recordChatUse();
    expect(useAuthStore.getState().chatRemaining()).toBe(ANON_CHAT_LIMIT - 1);
    useAuthStore.getState().markChatExhausted();
    expect(useAuthStore.getState().chatRemaining()).toBe(0);
  });
});
