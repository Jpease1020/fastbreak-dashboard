import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreateServerClient } = vi.hoisted(() => ({
  mockCreateServerClient: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: mockCreateServerClient,
}));

import { updateSession } from "@/lib/supabase/middleware";

describe("updateSession", () => {
  beforeEach(() => {
    mockCreateServerClient.mockReset();
  });

  it("redirects unauthenticated requests for protected routes to login", async () => {
    mockCreateServerClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    });

    const response = await updateSession(
      new NextRequest("https://fastbreak.app/dashboard")
    );

    expect(response.headers.get("location")).toBe("https://fastbreak.app/login");
  });

  it("allows unauthenticated access to the auth callback route", async () => {
    mockCreateServerClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    });

    const response = await updateSession(
      new NextRequest("https://fastbreak.app/auth/callback?code=abc123")
    );

    expect(response.headers.get("location")).toBeNull();
    expect(response.status).toBe(200);
  });

  it("redirects authenticated users away from login and signup", async () => {
    mockCreateServerClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1", email: "coach@example.com" } },
        }),
      },
    });

    const loginResponse = await updateSession(
      new NextRequest("https://fastbreak.app/login")
    );
    const signupResponse = await updateSession(
      new NextRequest("https://fastbreak.app/signup")
    );

    expect(loginResponse.headers.get("location")).toBe(
      "https://fastbreak.app/dashboard"
    );
    expect(signupResponse.headers.get("location")).toBe(
      "https://fastbreak.app/dashboard"
    );
  });

  it("passes authenticated protected-route requests through", async () => {
    mockCreateServerClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1", email: "coach@example.com" } },
        }),
      },
    });

    const response = await updateSession(
      new NextRequest("https://fastbreak.app/dashboard")
    );

    expect(response.headers.get("location")).toBeNull();
    expect(response.status).toBe(200);
  });
});
