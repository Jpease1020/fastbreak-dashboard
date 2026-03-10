export type EventVenue = {
  id: string;
  event_id: string;
  name: string;
  address: string | null;
  created_at: string;
};

export type SportEvent = {
  id: string;
  user_id: string;
  name: string;
  sport_type: string;
  date_time: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  event_venues: EventVenue[];
};

export type ActionResult<T> =
  | { data: T; error: null }
  | { data: null; error: string };

export const SPORT_TYPES = [
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
] as const;

export type SportType = (typeof SPORT_TYPES)[number];
