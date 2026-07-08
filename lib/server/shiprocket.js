/* Shiprocket fulfillment service (live). Auth token is cached in memory for ~24h and
   auto-refreshed. Credentials come from env: SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD.
   Every call throws a clear Error on failure (logged) so the caller can surface a
   friendly message. NOTE: all network calls run server-side only. */
/* eslint-disable no-console */

const BASE = "https://apiv2.shiprocket.in/v1/external";
const PICKUP_LOCATION = process.env.SHIPROCKET_PICKUP_LOCATION || "Primary";

// Cache the token across hot reloads / requests (module memory is per-process).
const cache = globalThis.__shiprocketAuth || (globalThis.__shiprocketAuth = { token: null, expiresAt: 0 });

async function srFetch(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch (e) {
    console.error(`[shiprocket] network error on ${method} ${path}:`, e.message);
    throw new Error("Couldn't reach Shiprocket. Please try again.");
  }
  let data = null;
  try { data = await res.json(); } catch { /* non-JSON body */ }
  if (!res.ok) {
    const msg = data?.message || data?.error || `HTTP ${res.status}`;
    console.error(`[shiprocket] ${method} ${path} failed (${res.status}):`, JSON.stringify(data));
    throw new Error(`Shiprocket: ${msg}`);
  }
  return data;
}

/* (a) Auth token, cached ~24h (refreshed 1h early to avoid mid-request expiry). */
export async function getToken() {
  if (cache.token && Date.now() < cache.expiresAt) return cache.token;
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  if (!email || !password) throw new Error("Shiprocket credentials are not configured (SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD).");
  const data = await srFetch("/auth/login", { method: "POST", body: { email, password } });
  if (!data?.token) {
    console.error("[shiprocket] /auth/login returned no token:", JSON.stringify(data));
    throw new Error("Shiprocket authentication failed.");
  }
  cache.token = data.token;
  cache.expiresAt = Date.now() + 23 * 60 * 60 * 1000; // 23h — token lives 24h
  return cache.token;
}

// "YYYY-MM-DD HH:MM" in IST (Shiprocket expects local-ish time).
function orderDate(d) {
  const dt = new Date(d || Date.now());
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(dt).reduce((a, x) => (a[x.type] = x.value, a), {});
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}

/* (b) Create an ad-hoc Shiprocket order from a RefurbishedKart order document. */
export async function createOrder(order) {
  const token = await getToken();
  const addr = order.shippingAddress || {};
  const isCod = String(order.paymentMethod || "").toUpperCase() === "COD";
  const payload = {
    order_id: order.orderId,
    order_date: orderDate(order.createdAt),
    pickup_location: PICKUP_LOCATION,
    channel_id: "",
    comment: "",
    billing_customer_name: addr.name || order.customerName || "",
    billing_last_name: "",
    billing_address: addr.line1 || "",
    billing_address_2: addr.line2 || "",
    billing_city: addr.city || "",
    billing_pincode: addr.pincode || "",
    billing_state: addr.state || "",
    billing_country: "India",
    billing_email: addr.email || order.email || "",
    billing_phone: addr.phone || "",
    shipping_is_billing: true,
    order_items: (order.lines || []).map((l) => ({
      name: l.name,
      sku: String(l.productId ?? l.name),
      units: Number(l.qty) || 1,
      selling_price: Number(l.unitPrice) || 0,
      discount: 0,
      tax: "",
      hsn: l.hsnCode || "",
    })),
    payment_method: isCod ? "COD" : "Prepaid",
    shipping_charges: Number(order.shippingCharge) || 0,
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: Number(order.discount) || 0,
    // COD collects only the REMAINING balance at delivery (10% was paid upfront via
    // Razorpay). Prepaid orders are fully paid, so their sub_total is the full total.
    sub_total: isCod ? (Number(order.codRemaining) || Number(order.total) || 0) : (Number(order.total) || 0),
    collect_payment: isCod ? (Number(order.codRemaining) || 0) : 0,
    length: 35, breadth: 25, height: 5, weight: 1.5,
  };
  const data = await srFetch("/orders/create/adhoc", { method: "POST", body: payload, token });
  const shiprocketOrderId = data?.order_id;
  const shipmentId = data?.shipment_id;
  if (!shipmentId) {
    console.error("[shiprocket] create/adhoc returned no shipment_id:", JSON.stringify(data));
    throw new Error("Shiprocket did not return a shipment. Check the pickup location and address.");
  }
  return { shiprocketOrderId: String(shiprocketOrderId ?? ""), shipmentId: String(shipmentId) };
}

/* (c) Assign a courier + AWB to a shipment. */
export async function generateAWB(shipmentId) {
  const token = await getToken();
  const data = await srFetch("/courier/assign/awb", { method: "POST", body: { shipment_id: shipmentId }, token });
  // Response shape: { response: { data: { awb_code, courier_name, ... } } } (varies).
  const d = data?.response?.data || data?.data || data || {};
  const awbCode = d.awb_code || d.awb || "";
  const courierName = d.courier_name || d.courier || "";
  if (!awbCode) {
    console.error("[shiprocket] assign/awb returned no awb_code:", JSON.stringify(data));
    throw new Error("Shiprocket couldn't assign a courier (AWB). Try again shortly.");
  }
  return { awbCode: String(awbCode), courierName: String(courierName) };
}

/* (d) Schedule pickup for a shipment. Non-fatal if it fails — the shipment + AWB
   already exist; pickup can be re-scheduled from the Shiprocket dashboard. */
export async function schedulePickup(shipmentId) {
  const token = await getToken();
  return srFetch("/courier/generate/pickup", { method: "POST", body: { shipment_ids: [shipmentId] }, token });
}

/* (e) Public tracking URL for an AWB. */
export function getTrackingUrl(awbCode) {
  return awbCode ? `https://shiprocket.co/tracking/${awbCode}` : "";
}

/* (f) Cancel a Shiprocket order by its Shiprocket order id. */
export async function cancelShiprocketOrder(shiprocketOrderId) {
  const token = await getToken();
  return srFetch("/orders/cancel", { method: "POST", body: { ids: [Number(shiprocketOrderId) || shiprocketOrderId] }, token });
}

/* (g) Fetch a Shiprocket order's current detail and normalise the current AWB /
   courier / status (used by the manual "Sync from Shiprocket" recovery). Field names
   vary, so we read from the order root and the first shipment. */
export async function getOrderDetail(shiprocketOrderId) {
  const token = await getToken();
  const res = await srFetch(`/orders/show/${shiprocketOrderId}`, { method: "GET", token });
  const d = res?.data || res || {};
  const shipment = Array.isArray(d.shipments) ? d.shipments[0] : (d.shipments || {});
  return {
    awb: String(d.awb || shipment.awb || shipment.awb_code || ""),
    courier: String(d.courier_name || shipment.courier || shipment.courier_name || ""),
    status: String(d.status || shipment.status || d.current_status || ""),
    raw: d,
  };
}
