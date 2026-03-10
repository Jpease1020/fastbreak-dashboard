import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { mockToast } from "@/__tests__/setup";
import { EventCard } from "@/components/events/event-card";
import type { SportEvent } from "@/lib/types";

const { mockDeleteEvent } = vi.hoisted(() => ({
  mockDeleteEvent: vi.fn(),
}));

vi.mock("@/lib/actions/events", () => ({
  deleteEvent: mockDeleteEvent,
}));

const mockEvent: SportEvent = {
  id: "event-123",
  user_id: "user-123",
  name: "Championship Game",
  sport_type: "Basketball",
  date_time: "2026-03-15T14:00:00Z",
  description: "Winner takes all",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  event_venues: [
    {
      id: "venue-1",
      event_id: "event-123",
      name: "Madison Square Garden",
      address: "4 Pennsylvania Plaza",
      created_at: "2026-01-01T00:00:00Z",
    },
  ],
};

describe("EventCard", () => {
  it("renders event name, formatted date, sport badge, description, and venue", () => {
    render(<EventCard event={mockEvent} />);

    expect(screen.getByText("Championship Game")).toBeInTheDocument();
    expect(screen.getByText("Basketball")).toBeInTheDocument();
    expect(screen.getByText("Winner takes all")).toBeInTheDocument();
    // date-fns format: "Mar 15, 2026 at 2:00 PM"
    expect(screen.getByText(/Mar 15, 2026/)).toBeInTheDocument();
    expect(screen.getByText(/Madison Square Garden/)).toBeInTheDocument();
    expect(screen.getByText(/4 Pennsylvania Plaza/)).toBeInTheDocument();
  });

  it("links to the edit page for the event", () => {
    render(<EventCard event={mockEvent} />);

    // Base UI Button with render={<Link>} produces an <a> with role="button"
    const editButton = screen.getByRole("button", { name: /edit/i });
    expect(editButton).toHaveAttribute("href", "/dashboard/events/event-123/edit");
  });

  it("opens the confirmation dialog before deleting", async () => {
    const user = userEvent.setup();
    render(<EventCard event={mockEvent} />);

    await user.click(screen.getByRole("button", { name: /^delete$/i }));

    expect(await screen.findByText("Delete event")).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to delete/)
    ).toBeInTheDocument();
    expect(mockDeleteEvent).not.toHaveBeenCalled();
  });

  it("deletes the event, shows success feedback, and closes the dialog", async () => {
    const user = userEvent.setup();
    mockDeleteEvent.mockResolvedValue({ data: true, error: null });
    render(<EventCard event={mockEvent} />);

    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    const dialog = (await screen.findByText("Delete event")).closest(
      "[data-slot='dialog-content']"
    );
    await user.click(within(dialog!).getByRole("button", { name: /^delete$/i }));

    await waitFor(() => {
      expect(mockDeleteEvent).toHaveBeenCalledWith("event-123");
      expect(mockToast.success).toHaveBeenCalledWith("Event deleted successfully");
    });

    await waitFor(() => {
      expect(screen.queryByText("Delete event")).not.toBeInTheDocument();
    });
  });

  it("keeps the dialog open and shows an error toast when deletion fails", async () => {
    const user = userEvent.setup();
    mockDeleteEvent.mockResolvedValue({
      data: null,
      error: "Delete failed",
    });
    render(<EventCard event={mockEvent} />);

    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    const dialog = (await screen.findByText("Delete event")).closest(
      "[data-slot='dialog-content']"
    );
    await user.click(within(dialog!).getByRole("button", { name: /^delete$/i }));

    await waitFor(() => {
      expect(mockDeleteEvent).toHaveBeenCalledWith("event-123");
      expect(mockToast.error).toHaveBeenCalledWith("Delete failed");
    });

    expect(screen.getByText("Delete event")).toBeInTheDocument();
  });
});
