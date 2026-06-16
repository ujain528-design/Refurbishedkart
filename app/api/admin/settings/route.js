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

    // Flash-sale slug change → remember the old slug so [flashSlug] can 308-redirect
    // it to the new one. Normalise both (strip leading slashes) before comparing.
    const norm = (v) => String(v || "").trim().replace(/^\/+/, "");
    if (patch.flashSaleSlug !== undefined) {
      const oldSlug = norm(doc?.data?.flashSaleSlug ?? DEFAULTS.flashSaleSlug);
      const newSlug = norm(patch.flashSaleSlug) || "flash-sale";
      merged.flashSaleSlug = newSlug;
      if (oldSlug && oldSlug !== newSlug) merged.flashSalePrevSlug = oldSlug;
    }

    await Settings.findByIdAndUpdate("store", { $set: { data: merged } }, { upsert: true });
    return NextResponse.json({ settings: merged });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
