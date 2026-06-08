import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Product, Coupon, MasterData } from "@/lib/server/models";
import { ALL_PRODUCTS } from "@/lib/data";
import { synonymRows } from "@/lib/search-synonyms";

export const dynamic = "force-dynamic";

const THINKPAD_IMAGES = [
  "/products/thinkpad-a.avif",
  "/products/thinkpad-b.avif",
  "/products/thinkpad-c.avif",
  "/products/thinkpad-d.avif",
  "/products/thinkpad-e.avif",
];

/* Dev-only seeder. Loads the catalogue into MongoDB (upsert by id, idempotent),
   assigns real ThinkPad images to ThinkPad products that lack them, seeds the
   SAVE10 coupon, and seeds search synonyms into MasterData (search_synonyms). */
export async function POST() {
  try {
    await dbConnect();

    let ti = 0;
    const ops = ALL_PRODUCTS.map((p) => {
      const doc = { ...p };
      if (!doc.image && /thinkpad/i.test(doc.name)) {
        const img = THINKPAD_IMAGES[ti % THINKPAD_IMAGES.length];
        ti++;
        doc.image = img;
        if (!doc.images || !doc.images.length) doc.images = [img];
      }
      return { updateOne: { filter: { id: doc.id }, update: { $set: doc }, upsert: true } };
    });
    const res = await Product.bulkWrite(ops);

    await Coupon.updateOne(
      { code: "SAVE10" },
      { $set: { code: "SAVE10", type: "percent", value: 10, minSubtotal: 0, active: true } },
      { upsert: true }
    );

    await MasterData.updateOne(
      { tableName: "search_synonyms" },
      { $set: { tableName: "search_synonyms", rows: synonymRows() } },
      { upsert: true }
    );

    const count = await Product.countDocuments();
    return NextResponse.json({
      ok: true,
      seeded: ALL_PRODUCTS.length,
      thinkpadImagesAssigned: ti,
      upserted: res.upsertedCount,
      modified: res.modifiedCount,
      productsInDb: count,
      coupons: ["SAVE10"],
      synonyms: synonymRows().length,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export const GET = POST;
