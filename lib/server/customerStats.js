import { User, Order } from "./models";

// Orders that count toward a customer's order count + spend: placed & not voided.
// Excludes never-paid (payment_pending), cancelled, and failed-COD orders.
const isCounted = (o) => {
  const s = String(o.status || "");
  return s !== "payment_pending" && s.toLowerCase() !== "cancelled" && s !== "cod_failed";
};
// WhatsApp opt-in stored either top-level or inside shippingAddress (checkout sends both).
const optedIn = (o) => (o.whatsappOptIn ?? o.shippingAddress?.whatsappOptIn) === true;

/* Aggregate every user + their order history into one flat row per customer. Buyers
   sorted first (most recent order). Non-buyers appear with 0 orders. */
export async function buildCustomerRows() {
  const [users, orders] = await Promise.all([
    User.find({ role: { $ne: "admin" } }).lean(),
    Order.find({}).select("userId total status createdAt shippingAddress whatsappOptIn").lean(),
  ]);

  const byUser = new Map();
  for (const o of orders) {
    const k = String(o.userId || "");
    if (!k) continue;
    if (!byUser.has(k)) byUser.set(k, []);
    byUser.get(k).push(o);
  }

  const rows = users.map((u) => {
    const all = byUser.get(String(u._id)) || [];
    const counted = all.filter(isCounted);
    const recent = [...all].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;
    const times = counted.map((o) => new Date(o.createdAt).getTime()).filter((t) => Number.isFinite(t));
    const addr = recent?.shippingAddress || {};
    return {
      name: u.name || addr.name || "",
      email: u.email || addr.email || "",
      phone: addr.phone || u.phone || "",
      whatsappOptIn: all.some(optedIn),
      totalOrders: counted.length,
      totalSpend: counted.reduce((a, o) => a + (Number(o.total) || 0), 0),
      firstOrderDate: times.length ? new Date(Math.min(...times)).toISOString() : "",
      lastOrderDate: times.length ? new Date(Math.max(...times)).toISOString() : "",
      city: addr.city || "",
      state: addr.state || "",
    };
  });

  rows.sort((a, b) => (b.lastOrderDate ? Date.parse(b.lastOrderDate) : 0) - (a.lastOrderDate ? Date.parse(a.lastOrderDate) : 0));
  return rows;
}
