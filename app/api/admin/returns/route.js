import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Return, Order } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";
import { lineRefundBasis, findReturnLine } from "@/lib/server/refunds";

export const dynamic = "force-dynamic";

// GET — all returns, optional ?status= filter, newest first. Each return is enriched
// with `orderPaid` — the amount the customer ACTUALLY paid for the RETURNED LINE: its
// proportional share of the coupon discount removed from its line price (shipping
// excluded). This is the correct refund basis, NOT the stored paidAmount (a raw line
// total that ignores coupons) and NOT the whole-order total (over-refunds when only
// one item of a multi-item order is returned). Read live so it's correct for existing
// returns too — no migration.
export async function GET(req) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const status = new URL(req.url).searchParams.get("status");
    const q = status && status !== "All" ? { status } : {};
    const docs = await Return.find(q).sort({ createdAt: -1 }).lean();

    const orderIds = [...new Set(docs.map((d) => d.orderId).filter(Boolean))];
    const orders = orderIds.length
      ? await Order.find({ orderId: { $in: orderIds } })
          .select("orderId subtotal discount lines total gst couponCode paymentMethod codUpfront codRemaining codStatus codAdvancePaid codBalanceCollected")
          .lean()
      : [];
    const byOrderId = Object.fromEntries(orders.map((o) => [o.orderId, o]));

    const returns = docs.map((r) => {
      const o = byOrderId[r.orderId];
      let orderPaid = null;
      let orderInfo = null;
      if (o) {
        const line = findReturnLine(o, r);
        // Per-line basis when the line resolves; else the discounted product total.
        orderPaid = line ? lineRefundBasis(o, line) : Math.max(0, (Number(o.subtotal) || 0) - (Number(o.discount) || 0));

        // Payment breakdown for the returned line (drives the admin modal).
        const orderSubtotal = Number(o.subtotal) || (o.lines || []).reduce((a, l) => a + (Number(l.unitPrice) || 0) * (Number(l.qty) || 1), 0);
        const lineTotal = line ? (Number(line.unitPrice) || 0) * (Number(line.qty) || 1) : 0;
        const lineDiscountShare = orderSubtotal > 0 ? Math.round((lineTotal / orderSubtotal) * (Number(o.discount) || 0)) : 0;
        const isCod = String(o.paymentMethod || "").toUpperCase() === "COD";
        orderInfo = {
          paymentMethod: o.paymentMethod || null,
          isCod,
          couponCode: o.couponCode || null,
          orderDiscount: Number(o.discount) || 0,
          orderTotal: Number(o.total) || 0,
          gst: o.gst || null,
          codUpfront: o.codUpfront ?? null,
          codRemaining: o.codRemaining ?? null,
          codStatus: o.codStatus ?? null,
          // Explicit confirmation (new) vs. inferred-from-status (legacy orders).
          codDelivered: o.codStatus === "delivered",
          codBalanceCollected: isCod ? (o.codBalanceCollected === true) : null,
          line: line ? { name: line.name, ram: line.ram ?? null, ssd: line.ssd ?? null, unitPrice: Number(line.unitPrice) || 0, qty: Number(line.qty) || 1 } : null,
          lineTotal,
          lineDiscountShare,
        };
      }
      // refundBankDetails is stored masked-only — the full details exist only in the
      // submission email to support@, never in this payload or the DB.
      return { id: r.returnId, ...r, orderPaid, orderPaymentMethod: o?.paymentMethod ?? null, orderInfo };
    });
    return NextResponse.json({ returns });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
