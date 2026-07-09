import { Coupon, Order, User } from "@/lib/server/models";

const DAY = 24 * 60 * 60 * 1000;
const lc = (s) => String(s ?? "").trim().toLowerCase();
const digits = (s) => String(s ?? "").replace(/\D/g, "");
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

// Orders that count toward a customer's history: placed & not voided.
const NOT_COUNTED = ["payment_pending", "Cancelled", "cancelled", "cod_failed"];
const FREE_SHIP_THRESHOLD = 7999;
const SHIPPING_FEE = 199;

const fail = (message) => ({ valid: false, discount: 0, message, coupon: null });

/* Discount for a valid coupon against the product subtotal (cartTotal).
   - percent: cartTotal × value% (capped at maxDiscount when set)
   - flat: min(value, cartTotal)
   - free_shipping: the shipping fee that would otherwise apply */
export function computeDiscount(c, cartTotal) {
  const t = Number(cartTotal) || 0;
  if (c.type === "flat") return Math.max(0, Math.min(Number(c.value) || 0, t));
  if (c.type === "free_shipping") return t < FREE_SHIP_THRESHOLD ? SHIPPING_FEE : 0;
  // percent
  let d = Math.round((t * (Number(c.value) || 0)) / 100);
  if (Number(c.maxDiscount) > 0) d = Math.min(d, Number(c.maxDiscount));
  return Math.max(0, d);
}

const expiryOf = (c) => c.expiryDate || c.expiry || null;

/* Full server-side coupon validation. Returns
   { valid, discount, message, coupon }. */
export async function validateCoupon(code, userId, cartTotal, cartItems = [], category = "") {
  const c = await Coupon.findOne({ code: String(code || "").trim().toUpperCase() }).lean();
  if (!c) return fail("Invalid coupon code");
  if (c.active === false) return fail("This coupon is no longer active.");

  const now = Date.now();
  if (c.startDate && new Date(c.startDate).getTime() > now) return fail(`Coupon valid from ${fmtDate(c.startDate)}`);
  const exp = expiryOf(c);
  if (exp && new Date(exp).getTime() < now) return fail("This coupon has expired.");

  // Total usage limit (0/undefined = unlimited).
  if (Number(c.usageLimit) > 0 && (c.used || 0) >= c.usageLimit) return fail("This coupon has reached its usage limit.");

  // Minimum order value.
  if ((Number(cartTotal) || 0) < (Number(c.minSubtotal) || 0)) {
    return fail(`Minimum order value ₹${c.minSubtotal} required`);
  }

  // Category / brand restrictions (empty arrays = no restriction).
  const cats = (c.applicableCategories || []).map(lc);
  const brands = (c.applicableBrands || []).map(lc);
  if (cats.length || brands.length) {
    const items = Array.isArray(cartItems) ? cartItems : [];
    const catOk = cats.length === 0
      || (items.length ? items.some((it) => cats.includes(lc(it.category))) : (category ? cats.includes(lc(category)) : false));
    const brandOk = brands.length === 0
      || (items.length ? items.some((it) => brands.includes(lc(it.brand))) : false);
    if (!catOk) return fail("This coupon isn't valid for the items in your cart.");
    if (!brandOk) return fail("This coupon isn't valid for the brands in your cart.");
  }

  const seg = c.customerSegment || "all";
  const needsUser = seg !== "all" || Number(c.perCustomerLimit) !== 0;

  // Per-customer usage limit (reads the orders collection).
  const perLimit = c.perCustomerLimit == null ? 1 : Number(c.perCustomerLimit);
  if (perLimit > 0 && userId) {
    const usedByUser = await Order.countDocuments({ userId, couponCode: c.code, status: { $nin: NOT_COUNTED } });
    if (usedByUser >= perLimit) return fail("You've already used this coupon.");
  }

  // Segment checks.
  if (seg !== "all") {
    if (!userId) return fail("Please sign in to use this coupon.");
    const orders = await Order.find({ userId, status: { $nin: NOT_COUNTED } })
      .select("total createdAt whatsappOptIn shippingAddress").lean();
    const count = orders.length;
    const totalSpend = orders.reduce((a, o) => a + (Number(o.total) || 0), 0);

    if (seg === "first_order") {
      if (count !== 0) return fail("This coupon is for first-time customers only.");
    } else if (seg === "nth_order") {
      if (count + 1 !== Number(c.nthOrder)) return fail(`This coupon applies only to your order #${c.nthOrder}.`);
    } else if (seg === "returning") {
      if (count < 1) return fail("This coupon is for returning customers only.");
    } else if (seg === "new_signup") {
      const u = await User.findById(userId).select("createdAt").lean();
      const days = Number(c.newSignupDays) || 0;
      if (!u?.createdAt || (now - new Date(u.createdAt).getTime()) > days * DAY) {
        return fail(`This coupon is for accounts registered within the last ${days} days.`);
      }
    } else if (seg === "high_value") {
      if (totalSpend < (Number(c.highValueAmount) || 0)) return fail("This coupon is not valid for your account.");
    } else if (seg === "inactive") {
      const days = Number(c.inactiveDays) || 0;
      const last = orders.length ? Math.max(...orders.map((o) => new Date(o.createdAt).getTime())) : 0;
      if (!orders.length || (now - last) < days * DAY) return fail("This coupon is for inactive customers only.");
    } else if (seg === "whatsapp") {
      const anyWa = orders.some((o) => (o.whatsappOptIn ?? o.shippingAddress?.whatsappOptIn) === true);
      if (!anyWa) return fail("This coupon is for WhatsApp subscribers only.");
    } else if (seg === "specific") {
      const u = await User.findById(userId).select("email phone").lean();
      const emails = (c.allowedEmails || []).map(lc);
      const phones = (c.allowedPhones || []).map(digits);
      const ok = (u?.email && emails.includes(lc(u.email))) || (u?.phone && phones.includes(digits(u.phone)));
      if (!ok) return fail("This coupon is not valid for your account.");
    }
  }

  return { valid: true, discount: computeDiscount(c, cartTotal), message: "", coupon: c };
}
