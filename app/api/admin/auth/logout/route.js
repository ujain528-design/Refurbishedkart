import { NextResponse } from "next/server";
import { clearAdminCookie } from "@/lib/server/adminAuth";

export const dynamic = "force-dynamic";

/* Clear the admin session cookie. */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  clearAdminCookie(res);
  return res;
}
