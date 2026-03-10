"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { safeAction } from "./safe-action";
import { eventSchema, type EventFormValues } from "@/lib/validations/events";
import type { SportEvent, ActionResult } from "@/lib/types";

export async function getEvents(
  search?: string,
  sportFilter?: string
): Promise<ActionResult<SportEvent[]>> {
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
  return safeAction(async () => {
    const parsed = eventSchema.parse(values);
    const supabase = await createClient();

    // Update event
    const { error: eventError } = await supabase
      .from("events")
      .update({
        name: parsed.name,
        sport_type: parsed.sport_type,
        date_time: parsed.date_time,
        description: parsed.description || null,
      })
      .eq("id", id);

    if (eventError) throw new Error(eventError.message);

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
  return safeAction(async () => {
    const supabase = await createClient();
    const { error } = await supabase.from("events").delete().eq("id", id);

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard");
    return true;
  });
}
