import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Return } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";
import { sendBankResubmissionRequest } from "@/lib/server/mailer";

export const dynamic = "force-dynamic";

// POST — admin asks the customer to resubmit corrected refund details. Clears the
// stored (masked) details so the customer's form unlocks, records the reason, and
// emails the customer.
export async function POST(req, { params }) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const ret = await Return.findOne({ returnId: params.id });
    if (!ret) return NextResponse.json({ error: "Return not found" }, { status: 404 });
    if (!(ret.refundBankDetails && ret.refundBankDetails.submittedAt)) {
      return NextResponse.json({ error: "No submitted bank details to resubmit" }, { status: 409 });
    }

    const { note } = await req.json().catch(() => ({}));
    const cleanNote = typeof note === "string" ? note.trim() : "";
    // Atomic $unset of the masked details (nested-path unset is unreliable via
    // doc.save) so the customer's form unlocks; flag + reason set alongside.
    await Return.updateOne(
      { returnId: ret.returnId },
      { $unset: { refundBankDetails: "" }, $set: { bankResubmissionRequested: true, bankResubmissionNote: cleanNote } }
    );

    if (ret.userEmail) {
      try {
        await sendBankResubmissionRequest(ret.userEmail, {
          returnId: ret.returnId,
          orderNumber: ret.orderId,
          customerName: ret.userName,
          note: cleanNote,
        });
      } catch {}
    }

    const updated = await Return.findOne({ returnId: ret.returnId }).lean();
    return NextResponse.json({ return: { id: updated.returnId, ...updated } });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
