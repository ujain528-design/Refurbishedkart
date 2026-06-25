import { NextResponse } from "next/server";
import { setupAdmin } from "@/lib/server/adminCreds";

export const dynamic = "force-dynamic";

/* First-time setup. Succeeds only ONCE (rejected if an admin already exists).
   No OTP required for the very first setup. */
export async function POST(req) {
  try {
    const { adminId, password, confirmPassword } = await req.json();
    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    }
    const r = await setupAdmin(String(adminId || "").trim(), String(password || ""));
    if (r.error) return NextResponse.json({ error: r.error }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
