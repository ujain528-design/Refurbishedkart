import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { PricingConfig } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";

export const dynamic = "force-dynamic";

/* PUT body: arbitrary settings object (e.g. { lowStockThreshold: 5 }). Stored on
   the pricing config doc. */
export async function PUT(req) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const settings = await req.json();
    const doc = (await PricingConfig.findById("pricing")) || new PricingConfig({ _id: "pricing", ram: {}, ssd: {} });
    doc.settings = { ...(doc.settings || {}), ...settings };
    doc.markModified("settings");
    await doc.save();
    return NextResponse.json({ settings: doc.settings });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
