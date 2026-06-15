/* Shared order-status helpers.

   The store mixes a lowercase payment lifecycle status (payment_pending — and the
   legacy alias pending_payment) with capitalized fulfillment statuses
   (Confirmed, Cancelled, Packed, Shipped, Delivered, Returned). These helpers
   normalize across both casings so customer + admin UIs agree. */

export const PAY_WINDOW_MS = 30 * 60 * 1000;        // 30-minute pay window
export const PAY_WARNING_MS = 5 * 60 * 1000;        // turn red under 5 minutes

const lc = (s) => String(s || "").toLowerCase();

export const isPaymentPending = (s) => lc(s) === "payment_pending" || lc(s) === "pending_payment";
export const isConfirmed = (s) => lc(s) === "confirmed";
export const isCancelled = (s) => lc(s) === "cancelled";

/* Human label for a cancellationReason. */
export const cancellationReasonLabel = (reason) => {
  switch (reason) {
    case "payment_timeout": return "Payment timeout (30 min expired)";
    case "payment_failed":  return "Payment failed";
    case "user_cancelled":  return "Cancelled by customer";
    default:                return reason ? String(reason) : "";
  }
};

/* ms → "MM:SS" (clamped at 0). */
export const formatCountdown = (ms) => {
  const t = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

/* Milliseconds left before a pending order's deadline (NaN-safe → 0). */
export const msUntilDeadline = (deadline) => {
  if (!deadline) return 0;
  const t = new Date(deadline).getTime();
  if (Number.isNaN(t)) return 0;
  return t - Date.now();
};
