import { NextResponse } from "next/server";
import { requireAdmin, clearAdminCookie } from "@/lib/server/adminAuth";
import { changeAdminCreds } from "@/lib/server/adminCreds";

export const dynamic = "force-dynamic";

/* After a valid OTP, update the admin ID/password. The OTP is consumed, and the
   current session cookie is cleared so the admin must log in again with the new
   credentials. */
export async function POST(req) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    const { otp, newAdminId, newPassword, confirmPassword } = await req.json();
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    }
    const r = await changeAdminCreds(String(otp || "").trim(), String(newAdminId || "").trim(), String(newPassword || ""));
    if (r.error) return NextResponse.json({ error: r.error }, { status: 400 });
    const res = NextResponse.json({ ok: true });
    clearAdminCookie(res); // invalidate the current session
    return res;
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
