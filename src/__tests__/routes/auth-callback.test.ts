import { describe, expect, it, vi } from "vitest";

const { mockCreateClient } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

import { GET } from "@/app/auth/callback/route";

describe("GET /auth/callback", () => {
  it("exchanges the code and redirects to the requested next path", async () => {
    const exchangeCodeForSession = vi.fn().mockResolvedValue({ error: null });
    mockCreateClient.mockResolvedValue({
      auth: { exchangeCodeForSession },
    });

    const response = await GET(
      new Request(
        "https://fastbreak.app/auth/callback?code=abc123&next=/dashboard/events/new"
      )
    );

    expect(exchangeCodeForSession).toHaveBeenCalledWith("abc123");
    expect(response.headers.get("location")).toBe(
      "https://fastbreak.app/dashboard/events/new"
    );
  });

  it("defaults successful callbacks to the dashboard", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
      },
    });

    const response = await GET(
      new Request("https://fastbreak.app/auth/callback?code=abc123")
    );

    expect(response.headers.get("location")).toBe(
      "https://fastbreak.app/dashboard"
    );
  });

  it("blocks open redirect via protocol-relative URL (//evil.com)", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
      },
    });

    const response = await GET(
      new Request("https://fastbreak.app/auth/callback?code=abc123&next=//evil.com")
    );

    expect(response.headers.get("location")).toBe(
      "https://fastbreak.app/dashboard"
    );
  });

  it("blocks open redirect via absolute URL", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
      },
    });

    const response = await GET(
      new Request(
        "https://fastbreak.app/auth/callback?code=abc123&next=https://evil.com"
      )
    );

    expect(response.headers.get("location")).toBe(
      "https://fastbreak.app/dashboard"
    );
  });

  it("redirects to login with an error when code exchange fails", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        exchangeCodeForSession: vi
          .fn()
          .mockResolvedValue({ error: { message: "exchange failed" } }),
      },
    });

    const response = await GET(
      new Request("https://fastbreak.app/auth/callback?code=bad-code")
    );

    expect(response.headers.get("location")).toBe(
      "https://fastbreak.app/login?error=auth_callback_error"
    );
  });

  it("redirects to login with an error when the code is missing", async () => {
    const response = await GET(new Request("https://fastbreak.app/auth/callback"));

    expect(response.headers.get("location")).toBe(
      "https://fastbreak.app/login?error=auth_callback_error"
    );
  });
});
