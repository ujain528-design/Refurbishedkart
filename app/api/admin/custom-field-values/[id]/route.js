import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { CustomFieldValue } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";

export const dynamic = "force-dynamic";

// DELETE — remove a custom value (master-data admin cleanup). Does NOT touch products
// already using the value; it only stops offering it in dropdowns going forward.
export async function DELETE(req, { params }) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const r = await CustomFieldValue.deleteOne({ _id: params.id });
    if (!r.deletedCount) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
