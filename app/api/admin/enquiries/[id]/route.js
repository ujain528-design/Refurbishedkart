import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { BulkEnquiry } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";

export const dynamic = "force-dynamic";

export async function PUT(req, { params }) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const d = await req.json();
    const set = {};
    if (d.status != null) set.status = d.status;
    if (d.notes != null) set.message = d.notes;
    const e = await BulkEnquiry.findByIdAndUpdate(params.id, { $set: set }, { new: true }).lean();
    if (!e) return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
    return NextResponse.json({ enquiry: { id: String(e._id), ...e } });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
