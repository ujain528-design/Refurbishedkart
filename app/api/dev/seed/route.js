import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Product, Coupon } from "@/lib/server/models";
import { ALL_PRODUCTS } from "@/lib/data";

export const dynamic = "force-dynamic";

/* Dev-only seeder. Loads the canonical catalogue from lib/data.js into MongoDB
   (upsert by numeric `id`, so re-running is idempotent) and seeds the SAVE10
   coupon. Runs inside the Next process where Mongo is reachable — the build
   sandbox cannot reach localhost:27017. */
export async function POST() {
  try {
    await dbConnect();

    const ops = ALL_PRODUCTS.map((p) => ({
      updateOne: { filter: { id: p.id }, update: { $set: p }, upsert: true },
    }));
    const res = await Product.bulkWrite(ops);

    await Coupon.updateOne(
      { code: "SAVE10" },
      { $set: { code: "SAVE10", type: "percent", value: 10, minSubtotal: 0, active: true } },
      { upsert: true }
    );

    const count = await Product.countDocuments();
    return NextResponse.json({
      ok: true,
      seeded: ALL_PRODUCTS.length,
      upserted: res.upsertedCount,
      modified: res.modifiedCount,
      productsInDb: count,
      coupons: ["SAVE10"],
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

// Allow GET too, for convenience when testing from a browser address bar.
export const GET = POST;
