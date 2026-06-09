import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Settings } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";
import { SETTINGS_DEFAULTS as DEFAULTS } from "@/lib/server/settings";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const doc = await Settings.findById("store").lean();
    return NextResponse.json({ settings: { ...DEFAULTS, ...(doc?.data || {}) } });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const patch = await req.json();
    const doc = await Settings.findById("store");
    const merged = { ...DEFAULTS, ...(doc?.data || {}), ...patch };
    await Settings.findByIdAndUpdate("store", { $set: { data: merged } }, { upsert: true });
    return NextResponse.json({ settings: merged });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
