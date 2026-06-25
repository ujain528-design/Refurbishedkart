import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/adminAuth";
import { createAdminOtp } from "@/lib/server/adminCreds";
import { sendAdminOtpEmail } from "@/lib/server/mailer";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = process.env.ADMIN_OTP_EMAIL || "admin@refurbishedkart.com";

/* Logged-in admin requests an OTP to change credentials. Code is emailed to the
   fixed admin address (never returned in the response). */
export async function POST(req) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    const code = await createAdminOtp();
    await sendAdminOtpEmail(ADMIN_EMAIL, code);
    return NextResponse.json({ ok: true, sentTo: ADMIN_EMAIL });
  } catch (e) {
    return NextResponse.json({ error: `Couldn't send OTP: ${e.message}` }, { status: 500 });
  }
}
