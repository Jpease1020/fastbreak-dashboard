import { describe, it, expect } from "vitest";
import { eventSchema, venueSchema } from "@/lib/validations/events";

describe("venueSchema", () => {
  it("validates a valid venue", () => {
    const result = venueSchema.safeParse({
      name: "Madison Square Garden",
      address: "4 Pennsylvania Plaza, New York",
    });
    expect(result.success).toBe(true);
  });

  it("validates a venue without address", () => {
    const result = venueSchema.safeParse({ name: "Main Field" });
    expect(result.success).toBe(true);
  });

  it("rejects a venue without name", () => {
    const result = venueSchema.safeParse({ name: "", address: "123 Main St" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty object", () => {
    const result = venueSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("eventSchema", () => {
  const validEvent = {
    name: "Championship Game",
    sport_type: "Basketball" as const,
    date_time: "2026-03-15T14:00",
    description: "Finals",
    venues: [{ name: "Arena", address: "123 Main St" }],
  };

  it("validates a complete valid event", () => {
    const result = eventSchema.safeParse(validEvent);
    expect(result.success).toBe(true);
  });

  it("validates an event without description", () => {
    const result = eventSchema.safeParse({
      name: validEvent.name,
      sport_type: validEvent.sport_type,
      date_time: validEvent.date_time,
      venues: validEvent.venues,
    });
    expect(result.success).toBe(true);
  });

  it("validates an event with multiple venues", () => {
    const result = eventSchema.safeParse({
      ...validEvent,
      venues: [
        { name: "Court A" },
        { name: "Court B", address: "456 Oak Ave" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an event without a name", () => {
    const result = eventSchema.safeParse({ ...validEvent, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an event with invalid sport type", () => {
    const result = eventSchema.safeParse({
      ...validEvent,
      sport_type: "Quidditch",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an event without date_time", () => {
    const result = eventSchema.safeParse({ ...validEvent, date_time: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an event with an unparseable date_time string", () => {
    const result = eventSchema.safeParse({
      ...validEvent,
      date_time: "not-a-date",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an event without venues", () => {
    const result = eventSchema.safeParse({ ...validEvent, venues: [] });
    expect(result.success).toBe(false);
  });

  it("validates all allowed sport types", () => {
    const sportTypes = [
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

    sportTypes.forEach((sport) => {
      const result = eventSchema.safeParse({
        ...validEvent,
        sport_type: sport,
      });
      expect(result.success).toBe(true);
    });
  });

  it("rejects a venue with an empty name inside the venues array", () => {
    const result = eventSchema.safeParse({
      ...validEvent,
      venues: [{ name: "" }],
    });
    expect(result.success).toBe(false);
  });
});
