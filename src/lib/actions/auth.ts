"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeAction } from "./safe-action";
import { headers } from "next/headers";

export async function login(formData: { email: string; password: string }) {
  const result = await safeAction(async () => {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });
    if (error) throw new Error(error.message);
    return true;
  });

  if (result.error) return result;

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: { email: string; password: string }) {
  const result = await safeAction(async () => {
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });
    if (error) throw new Error(error.message);
    return true;
  });

  if (result.error) return result;

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { data: null, error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
