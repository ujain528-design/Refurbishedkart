import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Order, Product } from "@/lib/server/models";
import { log, logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

/* Auto-cancel orders that sat in payment_pending past their 30-minute deadline.

   Intended to run as a scheduled cron (e.g. every 5 min). Protected by a shared
   secret header: callers must send `x-cron-secret: <CRON_SECRET>`. Anything else
   gets 403 — this endpoint must never be publicly triggerable.

   GET → { expired: <count> } */

async function releaseStock(order) {
  if (order.stockReleased) return;
  const perProduct = {};
  for (const l of order.lines || []) perProduct[l.productId] = (perProduct[l.productId] || 0) + l.qty;
  for (const [pid, qty] of Object.entries(perProduct)) {
    const p = await Product.findOne({ id: Number(pid) });
    if (p) { const next = (p.chassisStock ?? p.stock ?? 0) + qty; p.chassisStock = next; p.stock = next; await p.save(); }
  }
  order.stockReleased = true;
}

export async function GET(request) {
  // Auth gate — shared cron secret only.
  if (request.headers.get("x-cron-secret") !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    await dbConnect();
    const now = new Date();
    const stale = await Order.find({ status: "payment_pending", paymentDeadline: { $lt: now } });

    let expired = 0;
    for (const order of stale) {
      await releaseStock(order);
      order.status = "Cancelled";
      order.cancellationReason = "payment_timeout";
      order.cancelledAt = now;
      await order.save();
      expired += 1;
    }

    log("[expire-pending] cancelled", expired, "expired order(s)");
    return NextResponse.json({ expired });
  } catch (e) {
    logError("[expire-pending] error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
