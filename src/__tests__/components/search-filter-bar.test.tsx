import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { describe, expect, it, vi } from "vitest";

import { mockRouter, setMockSearchParams } from "@/__tests__/setup";
import { SearchFilterBar } from "@/components/events/search-filter-bar";

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
        <label htmlFor="sport-filter">Sport Filter</label>
        <select
          id="sport-filter"
          aria-label="Sport Filter"
          defaultValue={defaultValue}
          onChange={(event) => onValueChange(event.target.value)}
        >
          <option value="all">All sports</option>
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

describe("SearchFilterBar", () => {
  it("debounces search input so router.push is not called on every keystroke", async () => {
    // delay: null = instant typing — all keystrokes fire synchronously
    const user = userEvent.setup({ delay: null });
    setMockSearchParams({});
    render(<SearchFilterBar />);

    const input = screen.getByPlaceholderText("Search events...");
    await user.type(input, "fin");

    // Right after instant typing, the 300ms debounce hasn't fired yet
    expect(mockRouter.push).not.toHaveBeenCalled();

    // Wait for the debounce to settle — should result in a single call
    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledTimes(1);
    });

    expect(mockRouter.push).toHaveBeenCalledWith("/dashboard?search=fin");
  });

  it("hydrates the search input and sport filter from the current URL", () => {
    setMockSearchParams({ search: "playoffs", sport: "Soccer" });
    render(<SearchFilterBar />);

    expect(screen.getByPlaceholderText("Search events...")).toHaveValue("playoffs");
    expect(screen.getByLabelText("Sport Filter")).toHaveValue("Soccer");
  });

  it("updates the dashboard URL when the search term changes", async () => {
    const user = userEvent.setup();
    setMockSearchParams({ sport: "Basketball" });
    render(<SearchFilterBar />);

    const input = screen.getByPlaceholderText("Search events...");
    await user.type(input, "final");

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenLastCalledWith(
        "/dashboard?sport=Basketball&search=final"
      );
    });
  });

  it("removes the search parameter when the input is cleared", async () => {
    const user = userEvent.setup();
    setMockSearchParams({ search: "final", sport: "Basketball" });
    render(<SearchFilterBar />);

    const input = screen.getByPlaceholderText("Search events...");
    await user.clear(input);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenLastCalledWith(
        "/dashboard?sport=Basketball"
      );
    });
  });

  it("updates the sport filter while preserving the current search term", async () => {
    const user = userEvent.setup();
    setMockSearchParams({ search: "playoffs" });
    render(<SearchFilterBar />);

    await user.selectOptions(screen.getByLabelText("Sport Filter"), "Tennis");

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith(
        "/dashboard?search=playoffs&sport=Tennis"
      );
    });
  });

  it("removes the sport parameter when selecting all sports", async () => {
    const user = userEvent.setup();
    setMockSearchParams({ search: "playoffs", sport: "Tennis" });
    render(<SearchFilterBar />);

    await user.selectOptions(screen.getByLabelText("Sport Filter"), "all");

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith("/dashboard?search=playoffs");
    });
  });
});
