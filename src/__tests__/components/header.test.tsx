import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Header } from "@/components/layout/header";

const { mockLogout } = vi.hoisted(() => ({
  mockLogout: vi.fn(),
}));

vi.mock("@/lib/actions/auth", () => ({
  logout: mockLogout,
}));

describe("Header", () => {
  it("renders navigation links and the signed-in email", () => {
    render(<Header email="coach@example.com" />);

    expect(screen.getByRole("link", { name: /fastbreak/i })).toHaveAttribute(
      "href",
      "/dashboard"
    );
    expect(screen.getByRole("button", { name: /new event/i })).toHaveAttribute(
      "href",
      "/dashboard/events/new"
    );
    expect(screen.getByText("coach@example.com")).toBeInTheDocument();
  });

  it("submits the logout action from the sign out form", async () => {
    mockLogout.mockResolvedValue(undefined);
    render(<Header email="coach@example.com" />);

    const button = screen.getByRole("button", { name: /sign out/i });
    fireEvent.submit(button.closest("form")!);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledOnce();
    });
  });
});
