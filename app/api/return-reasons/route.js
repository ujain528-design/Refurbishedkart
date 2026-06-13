import { NextResponse } from "next/server";
import crypto from "crypto";
import { dbConnect } from "@/lib/server/mongoose";
import { MasterData } from "@/lib/server/models";
import { RETURN_REASONS } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

/* Public: active return reasons for the customer "Request Return" dropdown.
   Lazily seeds the "Return Reason" master table from RETURN_REASONS on first read,
   so admin can manage the list afterwards under Admin → Master Data. */
export async function GET() {
  try {
    await dbConnect();
    let doc = await MasterData.findOne({ tableName: "Return Reason" });
    if (!doc) {
      doc = await MasterData.create({
        tableName: "Return Reason",
        rows: RETURN_REASONS.map((value) => ({ id: crypto.randomUUID(), value, active: true })),
      });
    }
    const reasons = (doc.rows || []).filter((r) => r.active !== false).map((r) => r.value);
    return NextResponse.json({ reasons });
  } catch (e) {
    return NextResponse.json({ reasons: RETURN_REASONS, error: e.message }, { status: 200 });
  }
}
