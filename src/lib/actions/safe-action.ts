"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { type ActionResult } from "@/lib/types";

/** User-facing error messages for known error patterns */
const USER_ERRORS: Array<[RegExp, string]> = [
  [/not authenticated/i, "Please sign in to continue"],
  [/not authorized/i, "You don't have permission to do that"],
  [/event not found/i, "Event not found"],
];

function toUserMessage(e: unknown): string {
  const raw = e instanceof Error ? e.message : "Something went wrong";

  for (const [pattern, message] of USER_ERRORS) {
    if (pattern.test(raw)) return message;
  }

  // Don't leak internal details (table names, constraints, etc.)
  return "Something went wrong. Please try again.";
}

export async function safeAction<T>(
  fn: () => Promise<T>
): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (e) {
    // Next.js redirect() throws internally — let it propagate
    if (isRedirectError(e)) throw e;

    console.error("Action error:", e);
    return { data: null, error: toUserMessage(e) };
  }
}
