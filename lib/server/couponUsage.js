import { Order, Coupon } from "@/lib/server/models";
import { logError } from "@/lib/logger";

/* Claim a coupon usage slot EXACTLY ONCE, at PAYMENT CONFIRMATION (not order
   creation — abandoned/unpaid orders must never burn a slot).

   Idempotent across the two confirmation paths (client /payment/verify AND the
   Razorpay webhook): the order's `couponClaimed` flag is flipped false→true
   atomically, so only the first caller proceeds. The coupon increment itself is
   race-safe — the $expr filter only matches (and increments) while used <
   usageLimit, so two paid orders can't both grab the last slot.

   Rare edge: if the slot is already gone by the time payment confirms, we do NOT
   block the already-paid order — we flag `couponSlotUnavailable` on it for manual
   review. No-throw: a failure here never breaks payment confirmation. */
export async function claimCouponSlotOnce(order) {
  try {
    if (!order?.couponCode) return;
    // Idempotency guard: only the first confirmation path wins the flip.
    const won = await Order.findOneAndUpdate(
      { orderId: order.orderId, couponClaimed: { $ne: true } },
      { $set: { couponClaimed: true } }
    );
    if (!won) return; // the other path already claimed for this order
    const c = await Coupon.findOne({ code: order.couponCode }).lean();
    // No positive usageLimit → unlimited; nothing to count.
    if (!c || !(Number(c.usageLimit) > 0)) return;
    const claimed = await Coupon.findOneAndUpdate(
      { code: order.couponCode, active: true, $expr: { $lt: [{ $ifNull: ["$used", 0] }, "$usageLimit"] } },
      { $inc: { used: 1 } },
      { new: true }
    );
    if (!claimed) {
      await Order.updateOne({ orderId: order.orderId }, { $set: { couponSlotUnavailable: true } });
      logError("[coupon] usage slot unavailable at payment — order", order.orderId, "coupon", order.couponCode, "(flagged for review)");
    }
  } catch (e) {
    logError("[coupon] claimCouponSlotOnce failed:", e.message);
  }
}
