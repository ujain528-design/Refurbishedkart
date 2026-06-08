import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect, dbState } from "@/lib/server/mongoose";
import { Product } from "@/lib/server/models";

export const dynamic = "force-dynamic";

const STATES = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };

/* Pings MongoDB and reports connection status + product count. Runs in the Next
   process (the only place Mongo at localhost:27017 is reachable). */
export async function GET() {
  try {
    await dbConnect();
    const admin = mongoose.connection.db.admin();
    const ping = await admin.ping();
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
