import { NextResponse } from "next/server";
import { getStoreSettings } from "@/lib/server/settings";

export const dynamic = "force-dynamic";

/* Footer contact info from Settings (link columns stay static in the component). */
export async function GET() {
  try {
    const s = await getStoreSettings();
    return NextResponse.json({
      info: { gstin: s.gstin, phone: s.supportPhone, email: s.supportEmail, address: s.address },
    });
  } catch (e) {
    return NextResponse.json({ info: null, error: e.message }, { status: 500 });
  }
}
