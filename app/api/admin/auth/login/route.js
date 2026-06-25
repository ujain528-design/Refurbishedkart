import { NextResponse } from "next/server";
import { verifyAdminLogin } from "@/lib/server/adminCreds";
import { signAdminToken, setAdminCookie } from "@/lib/server/adminAuth";

export const dynamic = "force-dynamic";

/* Verify ID/password (with 5-strike / 15-min lockout) → set the httpOnly admin
   cookie (8-hour JWT). */
export async function POST(req) {
  try {
    const { adminId, password } = await req.json();
    const r = await verifyAdminLogin(String(adminId || "").trim(), String(password || ""));
    if (r.error) {
      const status = r.lockedMs ? 429 : 401;
      return NextResponse.json({ error: r.error, lockedMs: r.lockedMs }, { status });
    }
    const res = NextResponse.json({ ok: true, adminId: r.adminId });
    setAdminCookie(res, signAdminToken(r.adminId));
    return res;
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
