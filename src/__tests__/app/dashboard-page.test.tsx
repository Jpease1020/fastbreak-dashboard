import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { mockGetEvents } = vi.hoisted(() => ({
  mockGetEvents: vi.fn(),
}));

vi.mock("@/lib/actions/events", () => ({
  getEvents: mockGetEvents,
}));

vi.mock("@/components/events/search-filter-bar", () => ({
  SearchFilterBar: () => <div data-testid="search-filter-bar">search-filter</div>,
}));

vi.mock("@/components/events/event-card", () => ({
  EventCard: ({ event }: { event: { name: string } }) => (
    <article data-testid="event-card">{event.name}</article>
  ),
}));

import DashboardPage from "@/app/dashboard/page";

describe("DashboardPage", () => {
  it("renders fetched events and the total count", async () => {
    mockGetEvents.mockResolvedValue({
      data: [
        { id: "event-1", name: "Championship Game" },
        { id: "event-2", name: "Final Practice" },
      ],
      error: null,
    });

    render(
      await DashboardPage({
        searchParams: Promise.resolve({}),
      })
    );

    expect(mockGetEvents).toHaveBeenCalledWith(undefined, undefined);
    expect(screen.getByText("2 events")).toBeInTheDocument();
    expect(screen.getByText("Championship Game")).toBeInTheDocument();
    expect(screen.getByText("Final Practice")).toBeInTheDocument();
  });

  it("renders the empty state CTA when no events exist", async () => {
    mockGetEvents.mockResolvedValue({
      data: [],
      error: null,
    });

    render(
      await DashboardPage({
        searchParams: Promise.resolve({}),
      })
    );

    expect(screen.getByText("No events yet")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create your first event/i })
    ).toHaveAttribute("href", "/dashboard/events/new");
  });

  it("renders a filtered empty state when search results are empty", async () => {
    mockGetEvents.mockResolvedValue({
      data: [],
      error: null,
    });

    render(
      await DashboardPage({
        searchParams: Promise.resolve({ search: "playoffs", sport: "Soccer" }),
      })
    );

    expect(mockGetEvents).toHaveBeenCalledWith("playoffs", "Soccer");
    expect(screen.getByText("No matches")).toBeInTheDocument();
    expect(screen.queryByText("No events yet")).not.toBeInTheDocument();
  });

  it("renders the server error state when fetching events fails", async () => {
    mockGetEvents.mockResolvedValue({
      data: null,
      error: "Database unavailable",
    });

    render(
      await DashboardPage({
        searchParams: Promise.resolve({}),
      })
    );

    expect(
      screen.getByText("Failed to load events: Database unavailable")
    ).toBeInTheDocument();
  });
});
