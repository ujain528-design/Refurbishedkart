import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Order } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";
import { sendInvoiceUpdatedEmail } from "@/lib/server/mailer";

export const dynamic = "force-dynamic";

const DEFAULT_MSG = "Your invoice has been updated with device serial numbers.";

/* PATCH /api/admin/orders/[id]/serials — admin-only. Sets order.serialNumbers
   WITHOUT changing status, stamps invoiceUpdatedAt + message, and resets
   invoiceUpdateSeen so the customer gets a fresh notification. Also emails them. */
export async function PATCH(req, { params }) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const { serialNumbers, message, silent } = await req.json().catch(() => ({}));
    const serials = Array.isArray(serialNumbers) ? serialNumbers : [];
    const clean = serials.map((s) => ({
      productId: Number(s.productId) || undefined,
      productName: String(s.productName || ""),
      variant: String(s.variant || ""),
      serialNumber: String(s.serialNumber || "").trim(),
    }));

    // Silent save (used when backfilling old orders): persist serials only — don't
    // stamp the invoice-updated notice, don't reset "seen", don't email the customer.
    if (silent === true) {
      const o = await Order.findOneAndUpdate({ orderId: params.id }, { $set: { serialNumbers: clean } }, { new: true });
      if (!o) return NextResponse.json({ error: "Order not found" }, { status: 404 });
      return NextResponse.json({ order: { id: o.orderId, ...o.toObject() }, silent: true });
    }

    const invoiceUpdateMessage = String(message || "").trim() || DEFAULT_MSG;
    const o = await Order.findOneAndUpdate(
      { orderId: params.id },
      { $set: { serialNumbers: clean, invoiceUpdatedAt: new Date(), invoiceUpdateMessage, invoiceUpdateSeen: false } },
      { new: true }
    );
    if (!o) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    // Customer notification (async, non-blocking — a mail failure must not fail the save).
    const to = o.shippingAddress?.email || o.customerEmail || o.userEmail;
    const p = sendInvoiceUpdatedEmail(to, o.toObject());
    if (p && typeof p.catch === "function") {
      // eslint-disable-next-line no-console
      p.catch((err) => console.error("Invoice-updated email failed:", err.message));
    }

    return NextResponse.json({ order: { id: o.orderId, ...o.toObject() } });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
