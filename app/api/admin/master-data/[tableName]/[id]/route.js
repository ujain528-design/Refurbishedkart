import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { MasterData } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";

export const dynamic = "force-dynamic";

export async function PUT(req, { params }) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const d = await req.json();
    const doc = await MasterData.findOne({ tableName: params.tableName });
    if (!doc) return NextResponse.json({ error: "Table not found" }, { status: 404 });
    const row = doc.rows.find((r) => r.id === params.id);
    if (!row) return NextResponse.json({ error: "Value not found" }, { status: 404 });
    if (d.active != null) row.active = !!d.active;
    if (d.value != null) row.value = d.value;
    doc.markModified("rows");
    await doc.save();
    return NextResponse.json({ rows: doc.rows });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
