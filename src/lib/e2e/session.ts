import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

export const E2E_SESSION_COOKIE = "fastbreak_e2e_session";

const e2eSessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
};

export function isE2EMockEnabled() {
  return process.env.FASTBREAK_E2E_MOCK === "1";
}

export async function getE2ESessionEmail() {
  const cookieStore = await cookies();
  return cookieStore.get(E2E_SESSION_COOKIE)?.value ?? null;
}

export function getE2ESessionEmailFromRequest(request: NextRequest) {
  return request.cookies.get(E2E_SESSION_COOKIE)?.value ?? null;
}

export async function setE2ESession(email: string) {
  const cookieStore = await cookies();
  cookieStore.set(E2E_SESSION_COOKIE, email, e2eSessionCookieOptions);
}

export async function clearE2ESession() {
  const cookieStore = await cookies();
  cookieStore.set(E2E_SESSION_COOKIE, "", {
    ...e2eSessionCookieOptions,
    expires: new Date(0),
  });
}

export function writeE2ESession(response: NextResponse, email: string) {
  response.cookies.set(E2E_SESSION_COOKIE, email, e2eSessionCookieOptions);
}

export function clearE2ESessionOnResponse(response: NextResponse) {
  response.cookies.set(E2E_SESSION_COOKIE, "", {
    ...e2eSessionCookieOptions,
    expires: new Date(0),
  });
}
