/* Per-line refund basis: what the customer ACTUALLY paid for ONE order line, after
   the coupon discount is allocated proportionally across the order's lines. Shipping
   is excluded (an order-level service, not refunded per line).

     lineShare = (lineTotal / orderSubtotal) * couponDiscount
     linePaid  = lineTotal - lineShare

   Example — order: ₹10,000 + ₹5,000 (subtotal ₹15,000), coupon −₹3,000 (paid ₹12,000).
   Returning the ₹10,000 item: share = 10000/15000 * 3000 = ₹2,000 → linePaid ₹8,000
   (not ₹12,000 whole-order, not ₹10,000 full line price).

   For a single-line order this naturally equals the discounted line price (the product
   portion of what was paid) — e.g. the ₹14,999 item with a ₹14,990 coupon → ₹9.
   Division-safe: orderSubtotal 0 → no discount allocated. */
export function lineRefundBasis(order, line) {
  const lineTotal = (Number(line?.unitPrice) || 0) * (Number(line?.qty) || 1);
  const orderSubtotal =
    Number(order?.subtotal) ||
    (order?.lines || []).reduce((a, l) => a + (Number(l.unitPrice) || 0) * (Number(l.qty) || 1), 0);
  const discount = Number(order?.discount) || 0;
  const lineShare = orderSubtotal > 0 ? (lineTotal / orderSubtotal) * discount : 0;
  const fullBasis = Math.max(0, Math.round(lineTotal - lineShare));

  // COD order NOT yet delivered → only the upfront advance (codUpfront) was actually
  // collected; the balance is paid on delivery. Cap the refund basis at this line's
  // proportional share of codUpfront. A delivered COD order (codStatus "delivered"
  // or status "Delivered") collected the full amount, so it uses the full basis.
  // NOTE: in this store, paymentMethod is "COD" and the admin "Mark as Delivered"
  // sets codStatus="delivered" (status becomes "Confirmed"), so both signals matter.
  const isCod = String(order?.paymentMethod || "").toUpperCase() === "COD";
  const delivered = order?.codStatus === "delivered" || order?.status === "Delivered";
  if (isCod && !delivered) {
    const codUpfront = Number(order?.codUpfront) || 0;
    const lineShareOfUpfront = orderSubtotal > 0 ? Math.round((lineTotal / orderSubtotal) * codUpfront) : codUpfront;
    return Math.max(0, Math.min(fullBasis, lineShareOfUpfront));
  }
  return fullBasis;
}

/* Resolve the order line a return refers to: by productId, then product name, then
   the first line (single-item orders). Returns null when the order has no lines. */
export function findReturnLine(order, ret) {
  const lines = order?.lines || [];
  return (
    (ret?.productId != null && lines.find((l) => String(l.productId) === String(ret.productId))) ||
    (ret?.productName && lines.find((l) => l.name === ret.productName)) ||
    lines[0] ||
    null
  );
}
