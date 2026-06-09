import { NextResponse } from "next/server";
import crypto from "crypto";
import { dbConnect } from "@/lib/server/mongoose";
import { MasterData } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";
import { MASTER_TABLES } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

// Returns the doc for a table, lazily seeding it from MASTER_TABLES on first read.
async function loadTable(tableName) {
  let doc = await MasterData.findOne({ tableName });
  if (!doc) {
    const seed = MASTER_TABLES[tableName] || [];
    doc = await MasterData.create({
      tableName,
      rows: seed.map((value) => ({ id: crypto.randomUUID(), value, active: true })),
    });
  }
  return doc;
}

export async function GET(req, { params }) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const doc = await loadTable(params.tableName);
    return NextResponse.json({ tableName: params.tableName, rows: doc.rows });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const { value } = await req.json();
    if (!value) return NextResponse.json({ error: "Value required" }, { status: 400 });
    const doc = await loadTable(params.tableName);
    doc.rows.push({ id: crypto.randomUUID(), value, active: true });
    doc.markModified("rows");
    await doc.save();
    return NextResponse.json({ rows: doc.rows }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
