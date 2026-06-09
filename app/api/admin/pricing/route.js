import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/adminAuth";
import { getPricingConfig } from "@/lib/server/pricing";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    const cfg = await getPricingConfig();
    return NextResponse.json({ ram: cfg.ram || {}, ssd: cfg.ssd || {}, settings: cfg.settings || {} });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
