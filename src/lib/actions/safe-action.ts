"use server";

import { type ActionResult } from "@/lib/types";

export async function safeAction<T>(
  fn: () => Promise<T>
): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (e) {
    console.error("Action error:", e);
    return {
      data: null,
      error: e instanceof Error ? e.message : "Something went wrong",
    };
  }
}
