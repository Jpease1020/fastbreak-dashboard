import { describe, expect, it, vi } from "vitest";

import { safeAction } from "@/lib/actions/safe-action";

describe("safeAction", () => {
  it("returns successful data unchanged", async () => {
    await expect(
      safeAction(async () => ({ id: "event-1", name: "Championship Game" }))
    ).resolves.toEqual({
      data: { id: "event-1", name: "Championship Game" },
      error: null,
    });
  });

  it("converts Error instances into a typed error result", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      safeAction(async () => {
        throw new Error("Database connection failed");
      })
    ).resolves.toEqual({
      data: null,
      error: "Something went wrong. Please try again.",
    });

    expect(errorSpy).toHaveBeenCalledWith(
      "Action error:",
      expect.any(Error)
    );
  });

  it('maps "not authenticated" errors to a sign-in prompt', async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      safeAction(async () => {
        throw new Error("Not authenticated");
      })
    ).resolves.toEqual({
      data: null,
      error: "Please sign in to continue",
    });

    errorSpy.mockRestore();
  });

  it('maps "not authorized" errors to a permission message', async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      safeAction(async () => {
        throw new Error("Not authorized to modify this event");
      })
    ).resolves.toEqual({
      data: null,
      error: "You don't have permission to do that",
    });

    errorSpy.mockRestore();
  });

  it('maps "event not found" errors to a not-found message', async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      safeAction(async () => {
        throw new Error("Event not found");
      })
    ).resolves.toEqual({
      data: null,
      error: "Event not found",
    });

    errorSpy.mockRestore();
  });

  it("hides non-Error throws behind the generic message", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      safeAction(async () => {
        throw "boom";
      })
    ).resolves.toEqual({
      data: null,
      error: "Something went wrong. Please try again.",
    });

    expect(errorSpy).toHaveBeenCalledWith("Action error:", "boom");
  });
});
