import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { mockToast } from "@/__tests__/setup";
import { SignupForm } from "@/components/auth/signup-form";

const { mockSignup, mockSignInWithGoogle } = vi.hoisted(() => ({
  mockSignup: vi.fn(),
  mockSignInWithGoogle: vi.fn(),
}));

vi.mock("@/lib/actions/auth", () => ({
  signup: mockSignup,
  signInWithGoogle: mockSignInWithGoogle,
}));

describe("SignupForm", () => {
  it("blocks submission when the passwords do not match", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText(/^email$/i), "coach@fastbreak.dev");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(
      screen.getByLabelText(/confirm password/i),
      "password321"
    );
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(await screen.findByText("Passwords don't match")).toBeInTheDocument();
    expect(mockSignup).not.toHaveBeenCalled();
  });

  it("submits only the fields required by the signup action", async () => {
    const user = userEvent.setup();
    mockSignup.mockResolvedValue({ data: true, error: null });
    render(<SignupForm />);

    await user.type(screen.getByLabelText(/^email$/i), "coach@fastbreak.dev");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(
      screen.getByLabelText(/confirm password/i),
      "password123"
    );
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith({
        email: "coach@fastbreak.dev",
        password: "password123",
      });
    });
  });

  it("disables the submit button while the signup request is pending", async () => {
    const user = userEvent.setup();
    let resolveSignup:
      | ((value: { data: null; error: string }) => void)
      | undefined;
    const pendingSignup = new Promise<{ data: null; error: string }>(
      (resolve) => {
        resolveSignup = resolve;
      }
    );
    mockSignup.mockReturnValueOnce(pendingSignup);
    render(<SignupForm />);

    await user.type(screen.getByLabelText(/^email$/i), "coach@fastbreak.dev");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(
      screen.getByLabelText(/confirm password/i),
      "password123"
    );
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(screen.getByRole("button", { name: /create account/i })).toBeDisabled();

    resolveSignup?.({ data: null, error: "Email already registered" });

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("Email already registered");
      expect(
        screen.getByRole("button", { name: /create account/i })
      ).not.toBeDisabled();
    });
  });

  it("shows a toast when signup fails", async () => {
    const user = userEvent.setup();
    mockSignup.mockResolvedValue({ data: null, error: "Email already registered" });
    render(<SignupForm />);

    await user.type(screen.getByLabelText(/^email$/i), "coach@fastbreak.dev");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(
      screen.getByLabelText(/confirm password/i),
      "password123"
    );
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("Email already registered");
    });
  });

  it("starts Google signup and shows provider errors", async () => {
    const user = userEvent.setup();
    mockSignInWithGoogle.mockResolvedValue({
      data: null,
      error: "OAuth provider unavailable",
    });
    render(<SignupForm />);

    await user.click(screen.getByRole("button", { name: /google/i }));

    await waitFor(() => {
      expect(mockSignInWithGoogle).toHaveBeenCalledOnce();
      expect(mockToast.error).toHaveBeenCalledWith("OAuth provider unavailable");
    });
  });
});
