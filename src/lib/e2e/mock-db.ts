import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { EventFormValues } from "@/lib/validations/events";
import type { SportEvent, SportType } from "@/lib/types";

type MockUser = {
  id: string;
  email: string;
  password: string;
};

type SeedEvent = {
  id?: string;
  user_email: string;
  name: string;
  sport_type: string;
  date_time: string;
  description?: string | null;
  venues?: Array<{ name: string; address?: string | null }>;
};

type MockDb = {
  users: MockUser[];
  events: SportEvent[];
};

const DB_PATH = path.join(process.cwd(), ".e2e", "mock-db.json");

function defaultDb(): MockDb {
  return {
    users: [],
    events: [],
  };
}

async function ensureDb() {
  await mkdir(path.dirname(DB_PATH), { recursive: true });
  try {
    await readFile(DB_PATH, "utf8");
  } catch {
    await writeFile(DB_PATH, JSON.stringify(defaultDb(), null, 2), "utf8");
  }
}

async function readDb(): Promise<MockDb> {
  await ensureDb();
  const contents = await readFile(DB_PATH, "utf8");
  return JSON.parse(contents) as MockDb;
}

async function writeDb(db: MockDb) {
  await ensureDb();
  await writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

function makeId(prefix: string) {
  return `${prefix}-${randomUUID()}`;
}

function nowIsoString() {
  return new Date().toISOString();
}

function normalizeVenue(
  eventId: string,
  venue: { name: string; address?: string | null }
) {
  return {
    id: makeId("venue"),
    event_id: eventId,
    name: venue.name,
    address: venue.address?.trim() ? venue.address : null,
    created_at: nowIsoString(),
  };
}

function sortEvents(events: SportEvent[]) {
  return [...events].sort(
    (left, right) =>
      new Date(left.date_time).getTime() - new Date(right.date_time).getTime()
  );
}

export async function seedE2EMockDb({
  users = [],
  events = [],
}: {
  users?: Array<Partial<MockUser> & { email: string; password?: string }>;
  events?: SeedEvent[];
}) {
  const normalizedUsers: MockUser[] = users.map((user) => ({
    id: user.id ?? makeId("user"),
    email: user.email,
    password: user.password ?? "password123",
  }));

  const userIdsByEmail = new Map(
    normalizedUsers.map((user) => [user.email, user.id] as const)
  );

  const normalizedEvents: SportEvent[] = events.map((event) => {
    const eventId = event.id ?? makeId("event");
    const createdAt = nowIsoString();
    return {
      id: eventId,
      user_id: userIdsByEmail.get(event.user_email) ?? makeId("user"),
      name: event.name,
      sport_type: event.sport_type as SportType,
      date_time: event.date_time,
      description: event.description ?? null,
      created_at: createdAt,
      updated_at: createdAt,
      event_venues: (event.venues ?? []).map((venue) =>
        normalizeVenue(eventId, venue)
      ),
    };
  });

  await writeDb({
    users: normalizedUsers,
    events: normalizedEvents,
  });
}

export async function signupMockUser(formData: {
  email: string;
  password: string;
}) {
  const db = await readDb();
  const existingUser = db.users.find((user) => user.email === formData.email);

  if (existingUser) {
    throw new Error("User already exists");
  }

  db.users.push({
    id: makeId("user"),
    email: formData.email,
    password: formData.password,
  });

  await writeDb(db);
}

export async function loginMockUser(formData: {
  email: string;
  password: string;
}) {
  const db = await readDb();
  const user = db.users.find((entry) => entry.email === formData.email);

  if (!user || user.password !== formData.password) {
    throw new Error("Invalid login credentials");
  }

  return user;
}

export async function getMockUserByEmail(email: string) {
  const db = await readDb();
  return db.users.find((user) => user.email === email) ?? null;
}

export async function listMockEvents(search?: string, sportFilter?: string) {
  const db = await readDb();
  let events = sortEvents(db.events);

  if (search) {
    const normalizedSearch = search.toLowerCase();
    events = events.filter((event) =>
      event.name.toLowerCase().includes(normalizedSearch)
    );
  }

  if (sportFilter && sportFilter !== "all") {
    events = events.filter((event) => event.sport_type === sportFilter);
  }

  return events;
}

export async function getMockEventById(id: string) {
  const db = await readDb();
  return db.events.find((event) => event.id === id) ?? null;
}

export async function createMockEvent(userEmail: string, values: EventFormValues) {
  const db = await readDb();
  const user = db.users.find((entry) => entry.email === userEmail);

  if (!user) {
    throw new Error("Not authenticated");
  }

  const eventId = makeId("event");
  const createdAt = nowIsoString();
  const event: SportEvent = {
    id: eventId,
    user_id: user.id,
    name: values.name,
    sport_type: values.sport_type,
    date_time: values.date_time,
    description: values.description?.trim() ? values.description : null,
    created_at: createdAt,
    updated_at: createdAt,
    event_venues: values.venues.map((venue) => normalizeVenue(eventId, venue)),
  };

  db.events.push(event);
  await writeDb(db);

  return event;
}

export async function updateMockEvent(id: string, values: EventFormValues) {
  const db = await readDb();
  const index = db.events.findIndex((event) => event.id === id);

  if (index === -1) {
    throw new Error("Event not found");
  }

  const existing = db.events[index];
  db.events[index] = {
    ...existing,
    name: values.name,
    sport_type: values.sport_type,
    date_time: values.date_time,
    description: values.description?.trim() ? values.description : null,
    updated_at: nowIsoString(),
    event_venues: values.venues.map((venue) => normalizeVenue(id, venue)),
  };

  await writeDb(db);

  return db.events[index];
}

export async function deleteMockEvent(id: string) {
  const db = await readDb();
  const nextEvents = db.events.filter((event) => event.id !== id);

  if (nextEvents.length === db.events.length) {
    throw new Error("Event not found");
  }

  db.events = nextEvents;
  await writeDb(db);
}
