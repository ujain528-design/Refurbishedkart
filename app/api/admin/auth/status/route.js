import { NextResponse } from "next/server";
import { adminSetupRequired } from "@/lib/server/adminCreds";
import { adminFromRequest } from "@/lib/server/adminAuth";

export const dynamic = "force-dynamic";

/* Public: tells the /admin/login page whether to show Setup or Login, and whether
   the current visitor already has a valid admin session. */
export async function GET(req) {
  try {
    const setupRequired = await adminSetupRequired();
    const authed = !!adminFromRequest(req);
    return NextResponse.json({ setupRequired, authed });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
