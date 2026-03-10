import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { mockToast } from "@/__tests__/setup";
import { LoginForm } from "@/components/auth/login-form";

const { mockLogin, mockSignInWithGoogle } = vi.hoisted(() => ({
  mockLogin: vi.fn(),
  mockSignInWithGoogle: vi.fn(),
}));

vi.mock("@/lib/actions/auth", () => ({
  login: mockLogin,
  signInWithGoogle: mockSignInWithGoogle,
}));

describe("LoginForm", () => {
  it("blocks invalid submissions with client-side validation", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText("Please enter a valid email")).toBeInTheDocument();
    expect(
      screen.getByText("Password must be at least 6 characters")
    ).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("submits valid credentials to the login action", async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ data: true, error: null });
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "coach@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: "coach@example.com",
        password: "password123",
      });
    });
  });

  it("disables the submit button while the login request is in flight", async () => {
    const user = userEvent.setup();
    let resolveLogin: ((value: { data: null; error: string }) => void) | undefined;
    const pendingLogin = new Promise<{ data: null; error: string }>((resolve) => {
      resolveLogin = resolve;
    });
    mockLogin.mockReturnValueOnce(pendingLogin);
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "coach@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByRole("button", { name: /sign in/i })).toBeDisabled();

    resolveLogin?.({ data: null, error: "Invalid login credentials" });

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("Invalid login credentials");
      expect(screen.getByRole("button", { name: /sign in/i })).not.toBeDisabled();
    });
  });

  it("shows a toast when the login action returns an error", async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue({ data: null, error: "Invalid login credentials" });
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), "coach@example.com");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("Invalid login credentials");
    });
  });

  it("starts Google OAuth and surfaces provider errors", async () => {
    const user = userEvent.setup();
    mockSignInWithGoogle.mockResolvedValue({
      data: null,
      error: "OAuth provider unavailable",
    });
    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: /google/i }));

    await waitFor(() => {
      expect(mockSignInWithGoogle).toHaveBeenCalledOnce();
      expect(mockToast.error).toHaveBeenCalledWith("OAuth provider unavailable");
    });
  });
});
