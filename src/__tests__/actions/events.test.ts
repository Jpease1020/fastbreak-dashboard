import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreateClient, mockRevalidatePath } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  mockRevalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

import {
  createEvent,
  deleteEvent,
  getEvent,
  getEvents,
  updateEvent,
} from "@/lib/actions/events";

function createThenableQuery<T>(result: T) {
  const chain = {
    select: vi.fn(() => chain),
    order: vi.fn(() => chain),
    ilike: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve(result)),
    then: (onFulfilled: (value: T) => unknown, onRejected?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(onFulfilled, onRejected),
  };

  return chain;
}

function createFromMock(sequences: Record<string, unknown[]>) {
  return vi.fn((table: string) => {
    const next = sequences[table]?.shift();
    if (!next) {
      throw new Error(`Unexpected query for table "${table}"`);
    }
    return next;
  });
}

const validEventInput = {
  name: "Championship Game",
  sport_type: "Basketball" as const,
  date_time: "2026-03-15T14:00",
  description: "Finals rematch",
  venues: [
    { name: "Madison Square Garden", address: "4 Pennsylvania Plaza" },
    { name: "Practice Gym", address: "" },
  ],
};

describe("event actions", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockCreateClient.mockReset();
    mockRevalidatePath.mockReset();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("builds the event list query from search and sport filters", async () => {
    const query = createThenableQuery({
      data: [{ id: "event-1" }],
      error: null,
    });
    const from = createFromMock({ events: [query] });

    mockCreateClient.mockResolvedValue({
      from,
    });

    await expect(getEvents("champ", "Basketball")).resolves.toEqual({
      data: [{ id: "event-1" }],
      error: null,
    });

    expect(from).toHaveBeenCalledWith("events");
    expect(query.select).toHaveBeenCalledWith("*, event_venues(*)");
    expect(query.order).toHaveBeenCalledWith("date_time", { ascending: true });
    expect(query.ilike).toHaveBeenCalledWith("name", "%champ%");
    expect(query.eq).toHaveBeenCalledWith("sport_type", "Basketball");
  });

  it('does not add an equality filter when sport is "all"', async () => {
    const query = createThenableQuery({
      data: [{ id: "event-1" }],
      error: null,
    });
    const from = createFromMock({ events: [query] });

    mockCreateClient.mockResolvedValue({
      from,
    });

    await getEvents("champ", "all");

    expect(query.ilike).toHaveBeenCalledWith("name", "%champ%");
    expect(query.eq).not.toHaveBeenCalled();
  });

  it("fetches a single event by id", async () => {
    const query = createThenableQuery({
      data: { id: "event-42", event_venues: [] },
      error: null,
    });
    const from = createFromMock({ events: [query] });

    mockCreateClient.mockResolvedValue({
      from,
    });

    await expect(getEvent("event-42")).resolves.toEqual({
      data: { id: "event-42", event_venues: [] },
      error: null,
    });

    expect(query.select).toHaveBeenCalledWith("*, event_venues(*)");
    expect(query.eq).toHaveBeenCalledWith("id", "event-42");
    expect(query.single).toHaveBeenCalledOnce();
  });

  it("rejects event creation when there is no authenticated user", async () => {
    const from = vi.fn();
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
      from,
    });

    await expect(createEvent(validEventInput)).resolves.toEqual({
      data: null,
      error: "Please sign in to continue",
    });

    expect(from).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("creates an event, inserts venues, refetches the full record, and revalidates", async () => {
    const insertEventChain = {
      select: vi.fn(() => insertEventChain),
      single: vi.fn().mockResolvedValue({
        data: { id: "event-1" },
        error: null,
      }),
    };
    const eventInsertTable = {
      insert: vi.fn(() => insertEventChain),
    };
    const venueInsertTable = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
    const eventFetchQuery = createThenableQuery({
      data: {
        id: "event-1",
        name: "Championship Game",
        event_venues: [
          { id: "venue-1", name: "Madison Square Garden", address: "4 Pennsylvania Plaza" },
        ],
      },
      error: null,
    });
    const from = createFromMock({
      events: [eventInsertTable, eventFetchQuery],
      event_venues: [venueInsertTable],
    });

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
      },
      from,
    });

    await expect(createEvent(validEventInput)).resolves.toEqual({
      data: {
        id: "event-1",
        name: "Championship Game",
        event_venues: [
          {
            id: "venue-1",
            name: "Madison Square Garden",
            address: "4 Pennsylvania Plaza",
          },
        ],
      },
      error: null,
    });

    expect(eventInsertTable.insert).toHaveBeenCalledWith({
      user_id: "user-1",
      name: "Championship Game",
      sport_type: "Basketball",
      date_time: "2026-03-15T14:00",
      description: "Finals rematch",
    });
    expect(venueInsertTable.insert).toHaveBeenCalledWith([
      {
        event_id: "event-1",
        name: "Madison Square Garden",
        address: "4 Pennsylvania Plaza",
      },
      {
        event_id: "event-1",
        name: "Practice Gym",
        address: null,
      },
    ]);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("normalizes an empty description to null on create", async () => {
    const insertEventChain = {
      select: vi.fn(() => insertEventChain),
      single: vi.fn().mockResolvedValue({
        data: { id: "event-1" },
        error: null,
      }),
    };
    const eventInsertTable = {
      insert: vi.fn(() => insertEventChain),
    };
    const venueInsertTable = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
    const eventFetchQuery = createThenableQuery({
      data: { id: "event-1", event_venues: [] },
      error: null,
    });
    const from = createFromMock({
      events: [eventInsertTable, eventFetchQuery],
      event_venues: [venueInsertTable],
    });

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
      },
      from,
    });

    await createEvent({
      ...validEventInput,
      description: "",
    });

    expect(eventInsertTable.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        description: null,
      })
    );
  });

  it("updates the event with atomic ownership check and replaces venues", async () => {
    // The update chain: .update().eq("id").eq("user_id").select("id").single()
    const updateChain: Record<string, ReturnType<typeof vi.fn>> = {};
    updateChain.eq = vi.fn(() => updateChain);
    updateChain.select = vi.fn(() => updateChain);
    updateChain.single = vi.fn().mockResolvedValue({
      data: { id: "event-1" },
      error: null,
    });
    const eventUpdateTable = {
      update: vi.fn(() => updateChain),
    };
    const venueDeleteChain = {
      eq: vi.fn().mockResolvedValue({ error: null }),
    };
    const venueDeleteTable = {
      delete: vi.fn(() => venueDeleteChain),
    };
    const venueInsertTable = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
    const eventFetchQuery = createThenableQuery({
      data: {
        id: "event-1",
        name: "Championship Game",
        event_venues: [],
      },
      error: null,
    });
    const from = createFromMock({
      events: [eventUpdateTable, eventFetchQuery],
      event_venues: [venueDeleteTable, venueInsertTable],
    });

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
      },
      from,
    });

    await expect(updateEvent("event-1", validEventInput)).resolves.toEqual({
      data: {
        id: "event-1",
        name: "Championship Game",
        event_venues: [],
      },
      error: null,
    });

    expect(eventUpdateTable.update).toHaveBeenCalledWith({
      name: "Championship Game",
      sport_type: "Basketball",
      date_time: "2026-03-15T14:00",
      description: "Finals rematch",
    });
    // Verify atomic ownership: both .eq("id") and .eq("user_id") called
    expect(updateChain.eq).toHaveBeenCalledWith("id", "event-1");
    expect(updateChain.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(venueDeleteTable.delete).toHaveBeenCalledOnce();
    expect(venueDeleteChain.eq).toHaveBeenCalledWith("event_id", "event-1");
    expect(venueInsertTable.insert).toHaveBeenCalledWith([
      {
        event_id: "event-1",
        name: "Madison Square Garden",
        address: "4 Pennsylvania Plaza",
      },
      {
        event_id: "event-1",
        name: "Practice Gym",
        address: null,
      },
    ]);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("rejects update when the user does not own the event", async () => {
    // Simulate: .single() returns null data (ownership mismatch)
    const updateChain: Record<string, ReturnType<typeof vi.fn>> = {};
    updateChain.eq = vi.fn(() => updateChain);
    updateChain.select = vi.fn(() => updateChain);
    updateChain.single = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });
    const from = createFromMock({
      events: [{ update: vi.fn(() => updateChain) }],
    });

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-2" } } }),
      },
      from,
    });

    await expect(updateEvent("event-1", validEventInput)).resolves.toEqual({
      data: null,
      error: "You don't have permission to do that",
    });

    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("returns a typed error when venue replacement fails during update", async () => {
    const updateChain: Record<string, ReturnType<typeof vi.fn>> = {};
    updateChain.eq = vi.fn(() => updateChain);
    updateChain.select = vi.fn(() => updateChain);
    updateChain.single = vi.fn().mockResolvedValue({
      data: { id: "event-1" },
      error: null,
    });
    const venueDeleteChain = {
      eq: vi.fn().mockResolvedValue({ error: null }),
    };
    const venueInsertTable = {
      insert: vi
        .fn()
        .mockResolvedValue({ error: { message: "Failed to create venues" } }),
    };
    const from = createFromMock({
      events: [{ update: vi.fn(() => updateChain) }],
      event_venues: [
        { delete: vi.fn(() => venueDeleteChain) },
        venueInsertTable,
      ],
    });

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
      },
      from,
    });

    await expect(updateEvent("event-1", validEventInput)).resolves.toEqual({
      data: null,
      error: "Something went wrong. Please try again.",
    });

    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("deletes an event with atomic ownership check and revalidates", async () => {
    // The delete chain: .delete().eq("id").eq("user_id").select("id").single()
    const deleteChain: Record<string, ReturnType<typeof vi.fn>> = {};
    deleteChain.eq = vi.fn(() => deleteChain);
    deleteChain.select = vi.fn(() => deleteChain);
    deleteChain.single = vi.fn().mockResolvedValue({
      data: { id: "event-99" },
      error: null,
    });
    const from = createFromMock({
      events: [{ delete: vi.fn(() => deleteChain) }],
    });

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
      },
      from,
    });

    await expect(deleteEvent("event-99")).resolves.toEqual({
      data: true,
      error: null,
    });

    // Verify atomic ownership: both .eq("id") and .eq("user_id") called
    expect(deleteChain.eq).toHaveBeenCalledWith("id", "event-99");
    expect(deleteChain.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/dashboard");
  });

  it("rejects delete when the user does not own the event", async () => {
    const deleteChain: Record<string, ReturnType<typeof vi.fn>> = {};
    deleteChain.eq = vi.fn(() => deleteChain);
    deleteChain.select = vi.fn(() => deleteChain);
    deleteChain.single = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });
    const from = createFromMock({
      events: [{ delete: vi.fn(() => deleteChain) }],
    });

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-2" } } }),
      },
      from,
    });

    await expect(deleteEvent("event-99")).resolves.toEqual({
      data: null,
      error: "You don't have permission to do that",
    });

    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });
});
