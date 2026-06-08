import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect, dbState } from "@/lib/server/mongoose";
import { Product } from "@/lib/server/models";

export const dynamic = "force-dynamic";

const STATES = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };

/* GET /api/dev/health — pings MongoDB and reports connection status + product
   count. Runs in the Next process (the only place a local Mongo is reachable).
   Same check as /api/health/db, exposed at the path the dev tooling expects. */
export async function GET() {
  try {
    await dbConnect();
    const ping = await mongoose.connection.db.admin().ping();
    const products = await Product.countDocuments();
    return NextResponse.json({
      ok: true,
      state: STATES[dbState()],
      ping: ping?.ok === 1,
      dbName: mongoose.connection.name,
      productsInDb: products,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, state: STATES[dbState()], error: e.message },
      { status: 500 }
    );
  }
}
