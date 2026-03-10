import * as React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

export const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
};

export const mockRedirect = vi.fn();
export const mockNotFound = vi.fn();
export const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
};

let currentPathname = "/dashboard";
let currentSearchParams = new URLSearchParams();

export function setMockPathname(pathname: string) {
  currentPathname = pathname;
}

export function setMockSearchParams(
  value:
    | string
    | URLSearchParams
    | Record<string, string | number | boolean | null | undefined>
) {
  if (typeof value === "string") {
    currentSearchParams = new URLSearchParams(value);
    return;
  }

  if (value instanceof URLSearchParams) {
    currentSearchParams = new URLSearchParams(value.toString());
    return;
  }

  const params = new URLSearchParams();
  Object.entries(value).forEach(([key, entryValue]) => {
    if (entryValue !== undefined && entryValue !== null) {
      params.set(key, String(entryValue));
    }
  });
  currentSearchParams = params;
}

export function resetNavigationMocks() {
  setMockPathname("/dashboard");
  setMockSearchParams("");
}

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => currentSearchParams,
  usePathname: () => currentPathname,
  redirect: mockRedirect,
  notFound: mockNotFound,
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => {
    return React.createElement("a", { href, ...props }, children);
  },
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: mockToast,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  resetNavigationMocks();
});
