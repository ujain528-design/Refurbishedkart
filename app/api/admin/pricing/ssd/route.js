import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { PricingConfig } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";
import { recalculateListingsOnPriceChange } from "@/lib/server/pricing";

export const dynamic = "force-dynamic";

/* PUT body: { ssd: {"256GB":1000,...} } to replace, OR { capacity, price } to set
   a single cell. Recalculates all listings. */
export async function PUT(req) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const body = await req.json();
    const doc = (await PricingConfig.findById("pricing")) || new PricingConfig({ _id: "pricing", ram: {}, ssd: {} });

    if (body.ssd && typeof body.ssd === "object") {
      doc.ssd = body.ssd;
    } else if (body.capacity != null) {
      doc.ssd = { ...(doc.ssd || {}), [body.capacity]: Number(body.price) || 0 };
    }
    doc.markModified("ssd");
    await doc.save();

    const updated = await recalculateListingsOnPriceChange();
    return NextResponse.json({ ssd: doc.ssd, updated });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
