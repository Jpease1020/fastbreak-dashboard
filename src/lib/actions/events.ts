"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { safeAction } from "./safe-action";
import { eventSchema, type EventFormValues } from "@/lib/validations/events";
import type { SportEvent, ActionResult } from "@/lib/types";
import {
  createMockEvent,
  deleteMockEvent,
  getMockEventById,
  listMockEvents,
  updateMockEvent,
} from "@/lib/e2e/mock-db";
import { getE2ESessionEmail, isE2EMockEnabled } from "@/lib/e2e/session";

export async function getEvents(
  search?: string,
  sportFilter?: string
): Promise<ActionResult<SportEvent[]>> {
  if (isE2EMockEnabled()) {
    return safeAction(async () => listMockEvents(search, sportFilter));
  }

  return safeAction(async () => {
    const supabase = await createClient();

    let query = supabase
      .from("events")
      .select("*, event_venues(*)")
      .order("date_time", { ascending: true });

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    if (sportFilter && sportFilter !== "all") {
      query = query.eq("sport_type", sportFilter);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data as SportEvent[]) ?? [];
  });
}

export async function getEvent(
  id: string
): Promise<ActionResult<SportEvent>> {
  if (isE2EMockEnabled()) {
    return safeAction(async () => {
      const event = await getMockEventById(id);
      if (!event) throw new Error("Event not found");
      return event;
    });
  }

  return safeAction(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("events")
      .select("*, event_venues(*)")
      .eq("id", id)
      .single();

    if (error) throw new Error(error.message);
    return data as SportEvent;
  });
}

export async function createEvent(
  values: EventFormValues
): Promise<ActionResult<SportEvent>> {
  if (isE2EMockEnabled()) {
    return safeAction(async () => {
      const parsed = eventSchema.parse(values);
      const sessionEmail = await getE2ESessionEmail();
      if (!sessionEmail) throw new Error("Not authenticated");

      const event = await createMockEvent(sessionEmail, parsed);
      revalidatePath("/dashboard");
      return event;
    });
  }

  return safeAction(async () => {
    const parsed = eventSchema.parse(values);
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Insert event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .insert({
        user_id: user.id,
        name: parsed.name,
        sport_type: parsed.sport_type,
        date_time: parsed.date_time,
        description: parsed.description || null,
      })
      .select()
      .single();

    if (eventError) throw new Error(eventError.message);

    // Insert venues
    if (parsed.venues.length > 0) {
      const { error: venueError } = await supabase
        .from("event_venues")
        .insert(
          parsed.venues.map((v) => ({
            event_id: event.id,
            name: v.name,
            address: v.address || null,
          }))
        );

      if (venueError) throw new Error(venueError.message);
    }

    // Fetch the complete event with venues
    const { data: fullEvent, error: fetchError } = await supabase
      .from("events")
      .select("*, event_venues(*)")
      .eq("id", event.id)
      .single();

    if (fetchError) throw new Error(fetchError.message);

    revalidatePath("/dashboard");
    return fullEvent as SportEvent;
  });
}

export async function updateEvent(
  id: string,
  values: EventFormValues
): Promise<ActionResult<SportEvent>> {
  if (isE2EMockEnabled()) {
    return safeAction(async () => {
      const parsed = eventSchema.parse(values);
      const event = await updateMockEvent(id, parsed);
      revalidatePath("/dashboard");
      return event;
    });
  }

  return safeAction(async () => {
    const parsed = eventSchema.parse(values);
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Ownership enforced atomically in the WHERE clause
    const { data: updated, error: eventError } = await supabase
      .from("events")
      .update({
        name: parsed.name,
        sport_type: parsed.sport_type,
        date_time: parsed.date_time,
        description: parsed.description || null,
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id")
      .single();

    if (eventError || !updated) {
      throw new Error("Not authorized to modify this event");
    }

    // Delete old venues and insert new ones
    const { error: deleteError } = await supabase
      .from("event_venues")
      .delete()
      .eq("event_id", id);

    if (deleteError) throw new Error(deleteError.message);

    if (parsed.venues.length > 0) {
      const { error: venueError } = await supabase
        .from("event_venues")
        .insert(
          parsed.venues.map((v) => ({
            event_id: id,
            name: v.name,
            address: v.address || null,
          }))
        );

      if (venueError) throw new Error(venueError.message);
    }

    // Fetch updated event with venues
    const { data: fullEvent, error: fetchError } = await supabase
      .from("events")
      .select("*, event_venues(*)")
      .eq("id", id)
      .single();

    if (fetchError) throw new Error(fetchError.message);

    revalidatePath("/dashboard");
    return fullEvent as SportEvent;
  });
}

export async function deleteEvent(
  id: string
): Promise<ActionResult<boolean>> {
  if (isE2EMockEnabled()) {
    return safeAction(async () => {
      await deleteMockEvent(id);
      revalidatePath("/dashboard");
      return true;
    });
  }

  return safeAction(async () => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Ownership enforced atomically in the WHERE clause
    const { data: deleted, error } = await supabase
      .from("events")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id")
      .single();

    if (error || !deleted) {
      throw new Error("Not authorized to delete this event");
    }

    revalidatePath("/dashboard");
    return true;
  });
}
