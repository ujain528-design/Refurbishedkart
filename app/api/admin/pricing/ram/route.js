import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { PricingConfig } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";
import { recalculateListingsOnPriceChange } from "@/lib/server/pricing";

export const dynamic = "force-dynamic";

/* PUT body: { ram: {DDR4:{8:800,...},...} } to replace the table, OR
   { type, capacity, price } to set a single cell. Recalculates all listings. */
export async function PUT(req) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const body = await req.json();
    const doc = (await PricingConfig.findById("pricing")) || new PricingConfig({ _id: "pricing", ram: {}, ssd: {} });

    if (body.ram && typeof body.ram === "object") {
      doc.ram = body.ram;
    } else if (body.type && body.capacity != null) {
      const ram = { ...(doc.ram || {}) };
      ram[body.type] = { ...(ram[body.type] || {}), [body.capacity]: Number(body.price) || 0 };
      doc.ram = ram;
    }
    doc.markModified("ram");
    await doc.save();

    const updated = await recalculateListingsOnPriceChange();
    return NextResponse.json({ ram: doc.ram, updated });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
