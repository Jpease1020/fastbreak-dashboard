import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { mockRedirect } from "@/__tests__/setup";

const { mockCreateClient } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

vi.mock("@/components/layout/header", () => ({
  Header: ({ email }: { email?: string }) => (
    <div data-testid="header-email">{email ?? "missing-email"}</div>
  ),
}));

import DashboardLayout from "@/app/dashboard/layout";

describe("DashboardLayout", () => {
  it("redirects unauthenticated users to login", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
    });
    mockRedirect.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(
      DashboardLayout({
        children: <div>Protected content</div>,
      })
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("renders the header with the authenticated user's email", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { email: "coach@example.com" } },
        }),
      },
    });

    render(
      await DashboardLayout({
        children: <div>Protected content</div>,
      })
    );

    expect(screen.getByTestId("header-email")).toHaveTextContent(
      "coach@example.com"
    );
    expect(screen.getByText("Protected content")).toBeInTheDocument();
  });
});
