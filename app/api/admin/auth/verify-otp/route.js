import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/adminAuth";
import { checkAdminOtp } from "@/lib/server/adminCreds";

export const dynamic = "force-dynamic";

/* Validate an OTP without consuming it (the actual consume happens on
   change-credentials). Lets the UI reveal the new-credentials form. */
export async function POST(req) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    const { otp } = await req.json();
    const r = await checkAdminOtp(String(otp || "").trim());
    if (r.error) return NextResponse.json({ error: r.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
