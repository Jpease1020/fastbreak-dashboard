import { NextResponse } from "next/server";

import {
  clearE2ESessionOnResponse,
  isE2EMockEnabled,
  writeE2ESession,
} from "@/lib/e2e/session";
import { seedE2EMockDb } from "@/lib/e2e/mock-db";

export async function POST(request: Request) {
  if (!isE2EMockEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Require shared secret to prevent abuse if E2E mode is accidentally enabled
  const secret = request.headers.get("x-e2e-secret");
  if (secret !== process.env.E2E_SECRET) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    users?: Array<{ email: string; password?: string; id?: string }>;
    events?: Array<{
      id?: string;
      user_email: string;
      name: string;
      sport_type: string;
      date_time: string;
      description?: string | null;
      venues?: Array<{ name: string; address?: string | null }>;
    }>;
    sessionEmail?: string | null;
  };

  await seedE2EMockDb({
    users: body.users,
    events: body.events,
  });

  const response = NextResponse.json({ ok: true });

  if (body.sessionEmail) {
    writeE2ESession(response, body.sessionEmail);
  } else {
    clearE2ESessionOnResponse(response);
  }

  return response;
}
