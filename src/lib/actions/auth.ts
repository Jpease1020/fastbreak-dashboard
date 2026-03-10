"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeAction } from "./safe-action";
import { headers } from "next/headers";
import {
  clearE2ESession,
  isE2EMockEnabled,
  setE2ESession,
} from "@/lib/e2e/session";
import { loginMockUser, signupMockUser } from "@/lib/e2e/mock-db";

export async function login(formData: { email: string; password: string }) {
  if (isE2EMockEnabled()) {
    const result = await safeAction(async () => {
      await loginMockUser(formData);
      await setE2ESession(formData.email);
      return true;
    });

    if (result.error) return result;

    revalidatePath("/", "layout");
    redirect("/dashboard");
  }

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
  if (isE2EMockEnabled()) {
    const result = await safeAction(async () => {
      await signupMockUser(formData);
      await setE2ESession(formData.email);
      return true;
    });

    if (result.error) return result;

    revalidatePath("/", "layout");
    redirect("/dashboard");
  }

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
  if (isE2EMockEnabled()) {
    const email = "google-user@example.com";
    await signupMockUser({
      email,
      password: "google-oauth-user",
    }).catch(() => null);
    await setE2ESession(email);
    redirect("/dashboard");
  }

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

  return { data: null, error: "Failed to initialize Google sign-in" };
}

export async function logout() {
  if (isE2EMockEnabled()) {
    await clearE2ESession();
    revalidatePath("/", "layout");
    redirect("/login");
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
