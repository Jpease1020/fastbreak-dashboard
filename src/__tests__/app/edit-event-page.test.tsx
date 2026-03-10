import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { mockNotFound } from "@/__tests__/setup";

const { mockGetEvent } = vi.hoisted(() => ({
  mockGetEvent: vi.fn(),
}));

vi.mock("@/lib/actions/events", () => ({
  getEvent: mockGetEvent,
}));

vi.mock("@/components/events/event-form", () => ({
  EventForm: ({ event }: { event?: { name: string } }) => (
    <div data-testid="event-form">{event?.name ?? "missing-event"}</div>
  ),
}));

import EditEventPage from "@/app/dashboard/events/[id]/edit/page";

describe("EditEventPage", () => {
  it("renders the event form when the event exists", async () => {
    mockGetEvent.mockResolvedValue({
      data: { id: "event-1", name: "Championship Game" },
      error: null,
    });

    render(
      await EditEventPage({
        params: Promise.resolve({ id: "event-1" }),
      })
    );

    expect(mockGetEvent).toHaveBeenCalledWith("event-1");
    expect(screen.getByText("Edit Event")).toBeInTheDocument();
    expect(screen.getByTestId("event-form")).toHaveTextContent(
      "Championship Game"
    );
  });

  it("delegates missing events to notFound()", async () => {
    mockGetEvent.mockResolvedValue({
      data: null,
      error: "Event not found",
    });
    mockNotFound.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });

    await expect(
      EditEventPage({
        params: Promise.resolve({ id: "missing-event" }),
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(mockNotFound).toHaveBeenCalledOnce();
  });
});
