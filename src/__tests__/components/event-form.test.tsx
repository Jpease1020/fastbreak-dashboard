import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";

import { mockRouter, mockToast } from "@/__tests__/setup";
import { EventForm } from "@/components/events/event-form";
import type { SportEvent } from "@/lib/types";

const { mockCreateEvent, mockUpdateEvent } = vi.hoisted(() => ({
  mockCreateEvent: vi.fn(),
  mockUpdateEvent: vi.fn(),
}));

vi.mock("@/lib/actions/events", () => ({
  createEvent: mockCreateEvent,
  updateEvent: mockUpdateEvent,
}));

vi.mock("@/components/ui/select", () => {
  const SPORT_TYPES = [
    "Soccer",
    "Basketball",
    "Tennis",
    "Baseball",
    "Football",
    "Hockey",
    "Volleyball",
    "Golf",
    "Swimming",
    "Track & Field",
    "Other",
  ];

  return {
    Select: ({
      defaultValue,
      onValueChange,
      children,
    }: {
      defaultValue?: string;
      onValueChange: (value: string) => void;
      children: React.ReactNode;
    }) => (
      <div>
        {children}
        <label htmlFor="sport-type-select">Sport Type</label>
        <select
          id="sport-type-select"
          aria-label="Sport Type"
          defaultValue={defaultValue ?? ""}
          onChange={(event) => onValueChange(event.target.value)}
        >
          <option value="">Select a sport</option>
          {SPORT_TYPES.map((sport: string) => (
            <option key={sport} value={sport}>
              {sport}
            </option>
          ))}
        </select>
      </div>
    ),
    SelectTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SelectValue: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SelectItem: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

const mockEvent: SportEvent = {
  id: "event-123",
  user_id: "user-123",
  name: "Soccer Practice",
  sport_type: "Soccer",
  date_time: "2026-04-10T10:00:00Z",
  description: "Weekly practice session",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  event_venues: [
    {
      id: "venue-1",
      event_id: "event-123",
      name: "City Park Field",
      address: "100 Park Ave",
      created_at: "2026-01-01T00:00:00Z",
    },
  ],
};

async function fillRequiredFields() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/event name/i), "Championship Game");
  await user.selectOptions(screen.getByLabelText("Sport Type"), "Basketball");
  await user.type(screen.getByLabelText(/date & time/i), "2026-03-15T14:00");
  await user.type(screen.getByPlaceholderText("Venue name"), "Madison Square Garden");
  return user;
}

describe("EventForm", () => {
  it("shows validation errors and blocks submission when required fields are missing", async () => {
    const user = userEvent.setup();
    render(<EventForm />);

    await user.click(screen.getByRole("button", { name: /create event/i }));

    expect(await screen.findByText("Event name is required")).toBeInTheDocument();
    expect(screen.getByText("Please select a sport type")).toBeInTheDocument();
    expect(screen.getByText("Date and time is required")).toBeInTheDocument();
    expect(screen.getByText("Venue name is required")).toBeInTheDocument();
    expect(mockCreateEvent).not.toHaveBeenCalled();
  });

  it("creates an event, shows success feedback, and routes back to the dashboard", async () => {
    mockCreateEvent.mockResolvedValue({ data: { id: "event-1" }, error: null });
    render(<EventForm />);

    const user = await fillRequiredFields();
    await user.type(
      screen.getByLabelText(/description/i),
      "Winner takes the trophy"
    );
    await user.type(
      screen.getByPlaceholderText("Venue address (optional)"),
      "4 Pennsylvania Plaza"
    );
    await user.click(screen.getByRole("button", { name: /create event/i }));

    await waitFor(() => {
      expect(mockCreateEvent).toHaveBeenCalledWith({
        name: "Championship Game",
        sport_type: "Basketball",
        date_time: "2026-03-15T14:00",
        description: "Winner takes the trophy",
        venues: [
          {
            name: "Madison Square Garden",
            address: "4 Pennsylvania Plaza",
          },
        ],
      });
      expect(mockToast.success).toHaveBeenCalledWith("Event created successfully");
      expect(mockRouter.push).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows an error toast and stays on the form when creation fails", async () => {
    mockCreateEvent.mockResolvedValue({
      data: null,
      error: "Failed to create event",
    });
    render(<EventForm />);

    const user = await fillRequiredFields();
    await user.click(screen.getByRole("button", { name: /create event/i }));

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith("Failed to create event");
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  it("supports multiple venues in the create payload", async () => {
    mockCreateEvent.mockResolvedValue({ data: { id: "event-1" }, error: null });
    const user = userEvent.setup();
    render(<EventForm />);

    await user.type(screen.getByLabelText(/event name/i), "Championship Game");
    await user.selectOptions(screen.getByLabelText("Sport Type"), "Basketball");
    await user.type(screen.getByLabelText(/date & time/i), "2026-03-15T14:00");
    await user.type(screen.getByPlaceholderText("Venue name"), "Main Arena");
    await user.click(screen.getByRole("button", { name: /add venue/i }));

    const venueInputs = screen.getAllByPlaceholderText("Venue name");
    const addressInputs = screen.getAllByPlaceholderText("Venue address (optional)");
    await user.type(venueInputs[1], "Training Gym");
    await user.type(addressInputs[1], "12 Side Street");
    await user.click(screen.getByRole("button", { name: /create event/i }));

    await waitFor(() => {
      expect(mockCreateEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          venues: [
            { name: "Main Arena", address: "" },
            { name: "Training Gym", address: "12 Side Street" },
          ],
        })
      );
    });
  });

  it("updates an existing event and preserves the event id in edit mode", async () => {
    const user = userEvent.setup();
    mockUpdateEvent.mockResolvedValue({ data: { id: "event-123" }, error: null });
    render(<EventForm event={mockEvent} />);

    const nameInput = screen.getByLabelText(/event name/i);
    await user.clear(nameInput);
    await user.type(nameInput, "Championship Game");
    await user.click(screen.getByRole("button", { name: /update event/i }));

    await waitFor(() => {
      expect(mockUpdateEvent).toHaveBeenCalledWith("event-123", {
        name: "Championship Game",
        sport_type: "Soccer",
        date_time: "2026-04-10T10:00",
        description: "Weekly practice session",
        venues: [
          {
            name: "City Park Field",
            address: "100 Park Ave",
          },
        ],
      });
      expect(mockToast.success).toHaveBeenCalledWith("Event updated successfully");
      expect(mockRouter.push).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("removes a venue when the trash button is clicked", async () => {
    mockCreateEvent.mockResolvedValue({ data: { id: "event-1" }, error: null });
    const user = userEvent.setup();
    render(<EventForm />);

    // Fill required fields
    await user.type(screen.getByLabelText(/event name/i), "Championship Game");
    await user.selectOptions(screen.getByLabelText("Sport Type"), "Basketball");
    await user.type(screen.getByLabelText(/date & time/i), "2026-03-15T14:00");
    await user.type(screen.getByPlaceholderText("Venue name"), "Main Arena");

    // Add a second venue
    await user.click(screen.getByRole("button", { name: /add venue/i }));
    const venueInputs = screen.getAllByPlaceholderText("Venue name");
    expect(venueInputs).toHaveLength(2);
    await user.type(venueInputs[1], "Training Gym");

    // Remove the first venue
    await user.click(screen.getByRole("button", { name: /remove venue 1/i }));

    // Only the second venue should remain
    await waitFor(() => {
      expect(screen.getAllByPlaceholderText("Venue name")).toHaveLength(1);
    });
    expect(screen.getByPlaceholderText("Venue name")).toHaveValue("Training Gym");
  });

  it("routes back to the dashboard when cancel is clicked", async () => {
    const user = userEvent.setup();
    render(<EventForm />);

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(mockRouter.push).toHaveBeenCalledWith("/dashboard");
  });
});
