import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { mockRedirect } from "@/__tests__/setup";

const { mockCreateClient, mockRevalidatePath, mockHeaders } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  mockRevalidatePath: vi.fn(),
  mockHeaders: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

vi.mock("next/headers", () => ({
  headers: mockHeaders,
}));

import { login, logout, signInWithGoogle, signup } from "@/lib/actions/auth";

describe("auth actions", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockHeaders.mockResolvedValue(new Headers({ origin: "https://fastbreak.app" }));
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("logs in successfully, revalidates layout state, and redirects", async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({ error: null });
    mockCreateClient.mockResolvedValue({
      auth: { signInWithPassword },
    });

    await login({ email: "coach@fastbreak.dev", password: "password123" });

    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "coach@fastbreak.dev",
      password: "password123",
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
  });

  it("returns a typed error when login fails", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        signInWithPassword: vi
          .fn()
          .mockResolvedValue({ error: { message: "Invalid login credentials" } }),
      },
    });

    await expect(
      login({ email: "coach@fastbreak.dev", password: "badpass" })
    ).resolves.toEqual({
      data: null,
      error: "Something went wrong. Please try again.",
    });

    expect(mockRevalidatePath).not.toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("signs up successfully and redirects to the dashboard", async () => {
    const signUp = vi.fn().mockResolvedValue({ error: null });
    mockCreateClient.mockResolvedValue({
      auth: { signUp },
    });

    await signup({ email: "new@fastbreak.dev", password: "password123" });

    expect(signUp).toHaveBeenCalledWith({
      email: "new@fastbreak.dev",
      password: "password123",
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
  });

  it("returns OAuth errors without redirecting", async () => {
    const signInWithOAuth = vi.fn().mockResolvedValue({
      data: { url: null },
      error: { message: "OAuth provider unavailable" },
    });
    mockCreateClient.mockResolvedValue({
      auth: { signInWithOAuth },
    });

    await expect(signInWithGoogle()).resolves.toEqual({
      data: null,
      error: "OAuth provider unavailable",
    });

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: "https://fastbreak.app/auth/callback",
      },
    });
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("redirects to the provider URL for Google OAuth", async () => {
    const signInWithOAuth = vi.fn().mockResolvedValue({
      data: { url: "https://accounts.google.com/o/oauth2/v2/auth" },
      error: null,
    });
    mockCreateClient.mockResolvedValue({
      auth: { signInWithOAuth },
    });

    await signInWithGoogle();

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: "https://fastbreak.app/auth/callback",
      },
    });
    expect(mockRedirect).toHaveBeenCalledWith(
      "https://accounts.google.com/o/oauth2/v2/auth"
    );
  });

  it("logs out, revalidates, and redirects to login", async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null });
    mockCreateClient.mockResolvedValue({
      auth: { signOut },
    });

    await logout();

    expect(signOut).toHaveBeenCalledOnce();
    expect(mockRevalidatePath).toHaveBeenCalledWith("/", "layout");
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });
});
