import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AuthApiError,
  isValidEmail,
  loginUser,
  registerUser,
  validatePassword,
} from "@/lib/api/auth";

describe("isValidEmail", () => {
  it("accepts common emails", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("  user@example.com ")).toBe(true);
  });

  it("rejects invalid emails", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("@x.com")).toBe(false);
  });
});

describe("validatePassword", () => {
  it("requires strength rules matching backend", () => {
    expect(validatePassword("short")).toBe("password.tooShort");
    expect(validatePassword("alllowercase1!")).toBe("password.needUpper");
    expect(validatePassword("ALLUPPERCASE1!")).toBe("password.needLower");
    expect(validatePassword("NoDigits!!")).toBe("password.needDigit");
    expect(validatePassword("NoSpecial1")).toBe("password.needSpecial");
    expect(validatePassword("GoodPass1!")).toBeNull();
  });
});

describe("auth API", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it("registerUser posts JSON and returns user + token", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 7,
        email: "a@b.co",
        username: "alice",
        token: {
          access_token: "tok",
          token_type: "bearer",
          expires_at: "2099-01-01T00:00:00Z",
        },
      }),
    });

    const result = await registerUser({
      email: "a@b.co",
      password: "GoodPass1!",
      username: "alice",
    });

    expect(result.token.access_token).toBe("tok");
    expect(result.user.username).toBe("alice");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/auth/register"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      }),
    );
  });

  it("loginUser posts form body", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: "tok2",
        token_type: "bearer",
        expires_at: "2099-01-01T00:00:00Z",
      }),
    });

    const token = await loginUser({ email: "a@b.co", password: "x" });
    expect(token.access_token).toBe("tok2");

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.headers).toEqual(
      expect.objectContaining({
        "Content-Type": "application/x-www-form-urlencoded",
      }),
    );
    expect(String(init.body)).toContain("email=a%40b.co");
  });

  it("throws AuthApiError on failure", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ detail: "Invalid credentials" }),
    });

    await expect(loginUser({ email: "a@b.co", password: "bad" })).rejects.toBeInstanceOf(
      AuthApiError,
    );
  });
});
