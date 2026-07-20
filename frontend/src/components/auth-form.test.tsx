import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthForm } from "@/components/auth-form";
import { ChatUsage } from "@/components/chat-usage";
import { SiteHeader } from "@/components/site-header";
import { useAuthStore } from "@/lib/auth-store";
import { useLocaleStore } from "@/lib/i18n/store";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

vi.mock("@/lib/api/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/auth")>("@/lib/api/auth");
  return {
    ...actual,
    loginUser: vi.fn(async () => ({
      access_token: "tok",
      token_type: "bearer",
      expires_at: "2099-01-01T00:00:00.000Z",
    })),
    registerUser: vi.fn(async () => ({
      user: { id: 1, email: "a@b.co", username: "alice" },
      token: {
        access_token: "tok",
        token_type: "bearer",
        expires_at: "2099-01-01T00:00:00.000Z",
      },
    })),
  };
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  push.mockReset();
  refresh.mockReset();
});

beforeEach(() => {
  useLocaleStore.setState({ locale: "zh", hydrated: true });
  useAuthStore.setState({
    token: null,
    expiresAt: null,
    user: null,
    hydrated: true,
    usageCount: 0,
    sessionExpiredNotice: false,
  });
});

describe("AuthForm", () => {
  it("renders login fields and submits", async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="login" />);
    expect(screen.getByRole("heading", { name: /登录/i })).toBeTruthy();

    await user.type(screen.getByLabelText(/邮箱/i), "user@ex.com");
    await user.type(screen.getByLabelText(/^密码$/i), "GoodPass1!");
    await user.click(screen.getByRole("button", { name: /^登录$/i }));

    expect(localStorage.getItem("auth_token")).toBe("tok");
    expect(push).toHaveBeenCalledWith("/");
  });

  it("renders register fields and validates mismatch", async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="register" />);
    await user.type(screen.getByLabelText(/邮箱/i), "user@ex.com");
    await user.type(screen.getByLabelText(/用户名/i), "alice");
    await user.type(screen.getByLabelText(/^密码$/i), "GoodPass1!");
    await user.type(screen.getByLabelText(/确认密码/i), "GoodPass2!");
    await user.click(screen.getByRole("button", { name: /^注册$/i }));
    expect(screen.getByRole("alert").textContent).toMatch(/不一致/);
  });
});

describe("SiteHeader auth", () => {
  it("shows login/register when logged out", () => {
    render(<SiteHeader />);
    expect(screen.getByTestId("auth-login-link")).toBeTruthy();
    expect(screen.getByTestId("auth-register-link")).toBeTruthy();
  });

  it("shows username and logout when logged in", async () => {
    localStorage.setItem("auth_token", "tok");
    localStorage.setItem("auth_expires_at", "2099-01-01T00:00:00.000Z");
    localStorage.setItem(
      "auth_user",
      JSON.stringify({ id: 1, email: "a@b.co", username: "alice" }),
    );
    useAuthStore.setState({
      token: "tok",
      expiresAt: "2099-01-01T00:00:00.000Z",
      user: { id: 1, email: "a@b.co", username: "alice" },
      hydrated: false,
    });
    render(<SiteHeader />);
    expect(await screen.findByTestId("auth-username")).toHaveTextContent("alice");
    await userEvent.click(screen.getByTestId("auth-logout"));
    expect(useAuthStore.getState().token).toBeNull();
    expect(localStorage.getItem("auth_token")).toBeNull();
  });
});

describe("ChatUsage", () => {
  it("shows remaining quota and anon tip", () => {
    render(<ChatUsage />);
    expect(screen.getByTestId("chat-usage").textContent).toMatch(/今日剩余/);
    expect(screen.getByTestId("chat-anon-tip").textContent).toMatch(/注册/);
  });

  it("hides anon tip when authenticated", () => {
    useAuthStore.setState({
      token: "tok",
      expiresAt: "2099-01-01T00:00:00.000Z",
      user: { id: 1, email: "a@b.co", username: "alice" },
      hydrated: true,
      usageCount: 8,
    });
    render(<ChatUsage />);
    expect(screen.getByTestId("chat-usage").textContent).toMatch(/42\/50/);
    expect(screen.queryByTestId("chat-anon-tip")).toBeNull();
  });
});
