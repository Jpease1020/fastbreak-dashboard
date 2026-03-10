import { z } from "zod";
import { SPORT_TYPES } from "@/lib/types";

export const venueSchema = z.object({
  name: z.string().min(1, "Venue name is required"),
  address: z.string().optional(),
});

export const eventSchema = z.object({
  name: z.string().min(1, "Event name is required"),
  sport_type: z.enum([...SPORT_TYPES], {
    message: "Please select a sport type",
  }),
  date_time: z.string().min(1, "Date and time is required"),
  description: z.string().optional(),
  venues: z
    .array(venueSchema)
    .min(1, "At least one venue is required"),
});

export type EventFormValues = z.infer<typeof eventSchema>;
