import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Return } from "@/lib/server/models";
import { userFromRequest } from "@/lib/server/jwt";
import { validateBankDetails, buildMaskedBankDetails } from "@/lib/server/bankDetails";
import { sendBankDetailsAdminAlert } from "@/lib/server/mailer";

export const dynamic = "force-dynamic";

// POST — the signed-in customer submits their refund bank/UPI details for an
// APPROVED return. The FULL details are emailed once to support@ (the record); the
// DB stores ONLY masked values. Owner-only, locked after submit unless an admin has
// requested resubmission.
export async function POST(req, { params }) {
  const auth = userFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Login required" }, { status: 401 });
  try {
    await dbConnect();
    // Ownership: the return must belong to this user.
    const ret = await Return.findOne({ returnId: params.id, userId: auth.sub });
    if (!ret) return NextResponse.json({ error: "Return not found" }, { status: 404 });

    // Only collectable once the return is approved.
    if (ret.status !== "Approved") {
      return NextResponse.json({ error: "Bank details can only be submitted after the return is approved" }, { status: 409 });
    }
    // Locked after first submission — unless an admin has requested resubmission.
    const alreadySubmitted = ret.refundBankDetails && ret.refundBankDetails.submittedAt;
    if (alreadySubmitted && !ret.bankResubmissionRequested) {
      return NextResponse.json({ error: "Bank details have already been submitted for this return" }, { status: 409 });
    }

    const { ok, error, value } = validateBankDetails(await req.json());
    if (!ok) return NextResponse.json({ error }, { status: 400 });

    // 1) Email the FULL details to support@ — this is the documented record and the
    //    ONLY place the full details ever exist. It is REQUIRED: if the email fails,
    //    we do NOT persist anything, so the customer never sees "received" while no
    //    record exists. They retry.
    try {
      await sendBankDetailsAdminAlert({
        returnId: ret.returnId,
        orderNumber: ret.orderId,
        customerName: ret.userName,
        customerEmail: ret.userEmail,
        details: value, // full raw fields — email only
      });
    } catch {
      return NextResponse.json(
        { error: "Failed to submit bank details. Please try again or contact support at +91 8448296273." },
        { status: 502 }
      );
    }

    // 2) Email confirmed sent → persist masked-only. Clear any resubmission request.
    ret.refundBankDetails = { ...buildMaskedBankDetails(value), submittedAt: new Date() };
    ret.bankResubmissionRequested = false;
    ret.bankResubmissionNote = "";
    await ret.save();

    return NextResponse.json({ refundBankDetails: ret.refundBankDetails }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
