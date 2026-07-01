import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Return, Product, Order } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";
import { sendReturnEmail } from "@/lib/server/mailer";

export const dynamic = "force-dynamic";

const VALID = ["Requested", "Approved", "Rejected", "Picked Up", "Received", "Refunded"];

// PUT — update a return. Drives the workflow:
//   Requested → Approved (with refund/deduction) | Rejected (with reason)
//   Approved → Received (optionally add unit back to stock) → Refunded (manual refund done).
// No automatic Razorpay refund — the team processes the money manually, then marks Refunded.
export async function PUT(req, { params }) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const body = await req.json();
    const ret = await Return.findOne({ returnId: params.id });
    if (!ret) return NextResponse.json({ error: "Return not found" }, { status: 404 });

    const prevStatus = ret.status;
    const { status, adminNotes, refundAmount, deductionAmount, deductionReason, addToStock } = body;

    if (status !== undefined) {
      if (!VALID.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      // For COD / manual refunds the customer's bank/UPI details must be on file
      // before the refund can be marked processed (online refunds reverse to source,
      // so they don't need them). Authoritative server-side guard.
      if (status === "Refunded" && prevStatus !== "Refunded" && !(ret.refundBankDetails && ret.refundBankDetails.submittedAt)) {
        const ord = await Order.findOne({ orderId: ret.orderId }).select("paymentMethod").lean();
        const isCod = String(ord?.paymentMethod || "").toUpperCase() === "COD";
        if (isCod) {
          return NextResponse.json({ error: "Customer's refund bank details are required before a COD refund can be marked processed." }, { status: 409 });
        }
      }
      ret.status = status;
    }
    if (adminNotes !== undefined) ret.adminNotes = adminNotes;
    if (refundAmount !== undefined) ret.refundAmount = Number(refundAmount) || 0;
    if (deductionAmount !== undefined) ret.deductionAmount = Number(deductionAmount) || 0;
    if (deductionReason !== undefined) ret.deductionReason = deductionReason;

    // Append to the status-history audit trail on every actual transition.
    if (status !== undefined && status !== prevStatus) {
      ret.statusHistory = [
        ...(ret.statusHistory || []),
        { status, timestamp: new Date(), note: adminNotes || "", updatedBy: "admin" },
      ];
    }

    // Stamp refundedAt the first time it becomes Refunded.
    if (ret.status === "Refunded" && !ret.refundedAt) ret.refundedAt = new Date();

    // Optionally add the unit back to sellable stock when received (admin-confirmed,
    // since a defective unit may not be resellable). One-time.
    let stockAdded = false;
    if (ret.status === "Received" && addToStock === true && !ret.addedToStock) {
      const p = ret.productId ? await Product.findOne({ id: Number(ret.productId) }) : null;
      if (p) {
        const next = (p.chassisStock ?? p.stock ?? 0) + 1;
        p.chassisStock = next; p.stock = next; // mirror
        await p.save();
        ret.addedToStock = true;
        stockAdded = true;
      }
    }

    await ret.save();

    // When a refund is finalised, reflect it on the order too (non-blocking).
    if (status === "Refunded" && status !== prevStatus) {
      try { await Order.updateOne({ orderId: ret.orderId }, { $set: { status: "refunded" } }); } catch {}
    }

    // Email the customer on meaningful transitions (non-blocking). Picked Up and
    // Received are internal logistics steps — no customer email.
    if (status && status !== prevStatus && ret.userEmail) {
      const common = { returnId: ret.returnId, orderNumber: ret.orderId, customerName: ret.userName, productName: ret.productName };
      try {
        if (status === "Approved") {
          await sendReturnEmail(ret.userEmail, "approved", common);
        } else if (status === "Rejected") {
          await sendReturnEmail(ret.userEmail, "rejected", { ...common, reason: ret.adminNotes || "" });
        } else if (status === "Refunded") {
          await sendReturnEmail(ret.userEmail, "refunded", { ...common, refundAmount: ret.refundAmount });
        }
      } catch {}
    }

    // refundBankDetails is stored masked-only, so the doc is safe to return as-is.
    return NextResponse.json({ return: { id: ret.returnId, ...ret.toObject() }, stockAdded });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
