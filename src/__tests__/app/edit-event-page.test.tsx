import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { mockNotFound } from "@/__tests__/setup";

const { mockGetEvent, mockCreateClient } = vi.hoisted(() => ({
  mockGetEvent: vi.fn(),
  mockCreateClient: vi.fn(),
}));

vi.mock("@/lib/actions/events", () => ({
  getEvent: mockGetEvent,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

vi.mock("@/components/events/event-form", () => ({
  EventForm: ({ event }: { event?: { name: string } }) => (
    <div data-testid="event-form">{event?.name ?? "missing-event"}</div>
  ),
}));

import EditEventPage from "@/app/dashboard/events/[id]/edit/page";

describe("EditEventPage", () => {
  beforeEach(() => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "owner-user" } },
        }),
      },
    });
  });

  it("renders the event form when the event exists", async () => {
    mockGetEvent.mockResolvedValue({
      data: { id: "event-1", name: "Championship Game", user_id: "owner-user" },
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

  it("calls notFound() when the current user is not the event owner", async () => {
    mockGetEvent.mockResolvedValue({
      data: { id: "event-1", name: "Championship Game", user_id: "other-user" },
      error: null,
    });
    mockNotFound.mockImplementation(() => {
      throw new Error("NEXT_NOT_FOUND");
    });

    await expect(
      EditEventPage({
        params: Promise.resolve({ id: "event-1" }),
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(mockNotFound).toHaveBeenCalledOnce();
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
