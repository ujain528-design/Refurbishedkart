"use client";

import { getToken, removeToken } from "@/lib/auth";

// Base URL: blank => same-origin (Next API routes at /api). Configurable via env.
const BASE = process.env.NEXT_PUBLIC_API_URL || "";

async function request(method, url, { params, data } = {}) {
  let full = BASE + url;
  if (params) {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== "")).toString();
    if (q) full += (url.includes("?") ? "&" : "?") + q;
  }
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  // no-store: the storefront is admin-editable, so reads must never serve a
  // stale browser-cached response (e.g. hero settings after an admin save).
  const res = await fetch(full, { method, headers, cache: "no-store", body: data ? JSON.stringify(data) : undefined });

  // 401 → clear token and bounce to login (preserving return path)
  if (res.status === 401) {
    removeToken();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
    }
    throw new ApiError("Session expired", 401);
  }

  let body = null;
  try { body = await res.json(); } catch {}
  if (!res.ok) throw new ApiError(body?.error || `Request failed (${res.status})`, res.status, body);
  return body;
}

export class ApiError extends Error {
  constructor(message, status, body) { super(message); this.status = status; this.body = body; }
}

export const get = (url, params) => request("GET", url, { params });
export const post = (url, data) => request("POST", url, { data });
export const put = (url, data) => request("PUT", url, { data });
export const del = (url, data) => request("DELETE", url, { data });

/* Multipart upload — no JSON Content-Type so the browser sets the boundary. */
export async function uploadForm(url, formData) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + url, { method: "POST", headers, body: formData });
  if (res.status === 401) {
    removeToken();
    throw new ApiError("Session expired", 401);
  }
  let body = null;
  try { body = await res.json(); } catch {}
  if (!res.ok) throw new ApiError(body?.error || `Upload failed (${res.status})`, res.status, body);
  return body;
}

/* ───────────────────────── Named API helpers ─────────────────────────
   Thin wrappers over the routes. Each returns the parsed JSON body and
   throws ApiError on non-2xx so callers can render error states. */

// Products
export const getProducts = (params = {}) => get("/api/products", params).then((r) => r.products || []);
export const getProduct = (id) => get(`/api/products/${id}`).then((r) => r.product);
export const searchProductsApi = (q) => get("/api/products/search", { q }).then((r) => r.products || []);
export const getProductFilters = (category) => get(`/api/products/filters/${category}`);

// Pricing — server is authoritative. (Route contract is {productId, ram, ssd};
// ramType is derived server-side from the product, so we don't send it.)
export const calculatePrice = (productId, ram, ssd) =>
  post("/api/pricing/calculate", { productId, ram, ssd });

// Reviews
export const getReviews = (productId) => get(`/api/reviews/product/${productId}`);

// Orders
export const createOrder = (orderData) => post("/api/orders", orderData).then((r) => r.order);
export const getOrders = () => get("/api/orders").then((r) => r.orders || []);
export const getOrder = (id) => get(`/api/orders/${id}`).then((r) => r.order);
// Self-serve cancel disabled — cancellations handled by support team only.

/* Download a private GST invoice PDF. Must send the bearer token, so we can't use
   a plain <a href> — fetch the blob with auth, then trigger a browser download. */
export async function downloadInvoice(orderId) {
  const token = getToken();
  const res = await fetch(`${BASE}/api/invoices/${orderId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    let msg = `Couldn't fetch invoice (${res.status})`;
    try { msg = (await res.json())?.error || msg; } catch {}
    throw new ApiError(msg, res.status);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${orderId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Returns (customer)
export const getReturnReasons = () => get("/api/return-reasons").then((r) => r.reasons || []);
export const getReturns = () => get("/api/returns").then((r) => r.returns || []);
export const createReturn = (data) => post("/api/returns", data).then((r) => r.return);
export const uploadReturnPhoto = (file) => {
  const fd = new FormData();
  fd.append("file", file);
  return uploadForm("/api/returns/upload", fd);
};
// Submit refund bank/UPI details for an APPROVED return. Response echoes MASKED
// details only.
export const submitReturnBankDetails = (id, data) =>
  post(`/api/returns/${id}/bank-details`, data).then((r) => r.refundBankDetails);

// Coupons
export const applyCoupon = (code, subtotal, category) =>
  post("/api/coupons/apply", { code, subtotal, category });

// Best auto-apply coupon for the signed-in customer (or null). Best-effort:
// uses a RAW fetch (not the shared request() helper) so a 401 — guest, expired
// token, no session — resolves to null SILENTLY instead of wiping the token and
// redirecting to /login. Auto-apply must never disrupt the cart.
export async function getAutoCoupon(subtotal, category = "") {
  try {
    const token = getToken();
    if (!token) return null; // auto-apply is for signed-in customers only
    const res = await fetch(
      `${BASE}/api/coupons/auto?subtotal=${encodeURIComponent(subtotal || 0)}&category=${encodeURIComponent(category)}`,
      { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, cache: "no-store" }
    );
    if (!res.ok) return null; // 401 / 500 / etc → no auto-coupon, no redirect
    const body = await res.json().catch(() => null);
    return body?.coupon || null;
  } catch { return null; }
}

// Bulk enquiry
export const submitBulkEnquiry = (data) => post("/api/bulk-enquiry", data);

// Payments (Razorpay)
export const createRazorpayOrder = (orderId, amount) => post("/api/payment/create-order", { orderId, amount });
export const verifyPayment = (data) => post("/api/payment/verify", data);

// Collections (public)
export const getCollection = (slug) => get(`/api/collections/${slug}`);

// Public content (storefront consumes admin-managed collections/settings)
export const getBanners = () => get("/api/banners").then((r) => r.banners || []);
export const getAnnouncement = () => get("/api/content/announcement");
export const getFlashSale = () => get("/api/content/flash-sale");
export const getFooterInfo = () => get("/api/content/footer").then((r) => r.info);
export const getPublicSettings = () => get("/api/content/settings");

// User profile
export const getUserProfile = () => get("/api/users/profile").then((r) => r.user);
export const updateProfile = (data) => put("/api/users/profile", data).then((r) => r.user);

// Addresses
export const getAddresses = () => get("/api/users/addresses").then((r) => r.addresses || []);
export const addAddress = (data) => post("/api/users/addresses", data).then((r) => r.addresses || []);
export const updateAddress = (id, data) => put(`/api/users/addresses/${id}`, data).then((r) => r.addresses || []);
export const deleteAddress = (id) => del(`/api/users/addresses/${id}`).then((r) => r.addresses || []);
export const setDefaultAddress = (id) => put(`/api/users/addresses/${id}/default`, {}).then((r) => r.addresses || []);

// Wishlist
export const getWishlist = () => get("/api/users/wishlist").then((r) => r.ids || []);
export const addToWishlist = (productId) => post("/api/users/wishlist", { productId }).then((r) => r.ids || []);
export const removeFromWishlist = (productId) => del(`/api/users/wishlist/${productId}`).then((r) => r.ids || []);
export const mergeWishlist = (productIds) => post("/api/users/wishlist/merge", { ids: productIds }).then((r) => r.ids || []);

/* ───────────────────────── Admin API helpers ─────────────────────────
   All hit /api/admin/* routes which enforce admin/superadmin via the JWT. */

// Admin · Collections
export const adminGetCollections = () => get("/api/admin/collections").then((r) => r.collections || []);
export const adminGetCollection = (id) => get(`/api/admin/collections/${id}`).then((r) => r.collection);
export const adminCreateCollection = (data) => post("/api/admin/collections", data).then((r) => r.collection);
export const adminUpdateCollection = (id, data) => put(`/api/admin/collections/${id}`, data).then((r) => r.collection);
export const adminDeleteCollection = (id) => del(`/api/admin/collections/${id}`);

// Admin · Returns
export const adminGetReturns = (params = {}) => get("/api/admin/returns", params).then((r) => r.returns || []);
export const adminUpdateReturn = (id, data) => put(`/api/admin/returns/${id}`, data).then((r) => r);
// Ask the customer to resubmit corrected refund details (clears the masked record).
export const adminRequestBankResubmission = (id, note) =>
  post(`/api/admin/returns/${id}/bank-resubmission`, { note }).then((r) => r.return);

// Admin · Custom dropdown values (per field, optionally scoped to a family)
export const adminGetCustomFieldValues = (params = {}) =>
  get("/api/admin/custom-field-values", params).then((r) => r.values || []);
export const adminAddCustomFieldValue = (data) =>
  post("/api/admin/custom-field-values", data).then((r) => ({ value: r.value, duplicate: !!r.duplicate }));
export const adminDeleteCustomFieldValue = (id) => del(`/api/admin/custom-field-values/${id}`);

// Admin · Customers
export const adminGetCustomers = () => get("/api/admin/customers").then((r) => r);
// Download the customer export .xlsx (cookie/bearer auth → fetch blob → save).
export async function adminExportCustomers(whatsappOnly = false) {
  const token = getToken();
  const url = `${BASE}/api/admin/customers/export${whatsappOnly ? "?list=whatsapp" : ""}`;
  const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) {
    let msg = `Export failed (${res.status})`;
    try { msg = (await res.json())?.error || msg; } catch {}
    throw new ApiError(msg, res.status);
  }
  const blob = await res.blob();
  const cd = res.headers.get("Content-Disposition") || "";
  const m = /filename="?([^"]+)"?/.exec(cd);
  const name = m ? m[1] : `customers-export.xlsx`;
  const u = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = u; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(u);
}

// Admin · Products
export const adminGetProducts = (params = {}) => get("/api/admin/products", params).then((r) => r.products || []);
export const adminGetProduct = (id) => get(`/api/admin/products/${id}`).then((r) => r.product);
export const adminCreateProduct = (data) => post("/api/admin/products", data).then((r) => r.product);
export const adminUpdateProduct = (id, data) => put(`/api/admin/products/${id}`, data).then((r) => r.product);
export const adminDeleteProduct = (id) => del(`/api/admin/products/${id}`);
export const adminUpdateStock = (id, body) => put(`/api/admin/products/${id}/stock`, body).then((r) => r.product);
export const adminAuditProducts = () => get("/api/admin/products/audit");
// Backfill SEO slugs for products that don't have one yet (idempotent).
export const adminBackfillSlugs = () => post("/api/admin/products/backfill-slugs", {});
// Bulk import is a two-phase JSON flow: validate (preview) then import. The CSV is
// parsed client-side into row objects; the server is the validation gate for both.
export const adminBulkValidate = (category, rows) => post("/api/admin/products/bulk", { category, rows, mode: "validate" });
export const adminBulkImport = (category, rows) => post("/api/admin/products/bulk", { category, rows, mode: "import" });

// Product image search (Google CSE) + server-side fetch/process into the uploads folder.
export const searchProductImages = (modelName) => post("/api/admin/products/search-images", { modelName });
export const fetchProductImage = (imageUrl) => post("/api/admin/products/fetch-image", { imageUrl });

// Admin · Pricing
export const adminGetPricingConfig = () => get("/api/admin/pricing");
export const adminUpdateRamPricing = (data) => put("/api/admin/pricing/ram", data);
export const adminUpdateSsdPricing = (data) => put("/api/admin/pricing/ssd", data);
export const adminRecomputeAllPrices = (dryRun = false, force = false) => post(`/api/admin/pricing/recompute-all${dryRun ? "?dryRun=true" : ""}`, force ? { force: true } : {});
export const adminUpdateSettings = (data) => put("/api/admin/pricing/settings", data);

// Admin · Orders
export const adminGetOrders = (params = {}) => get("/api/admin/orders", params).then((r) => r.orders || []);
export const adminGetOrder = (id) => get(`/api/admin/orders/${id}`).then((r) => r.order);
export const adminUpdateOrderStatus = (id, status, cancellationReason, extra = {}) =>
  put(`/api/admin/orders/${id}/status`, { status, ...(cancellationReason ? { cancellationReason } : {}), ...extra }).then((r) => r.order);
export const adminUpdateTracking = (id, data) => put(`/api/admin/orders/${id}/tracking`, data).then((r) => r.order);
// Create a Shiprocket shipment (create order → AWB → pickup). Returns { order, shipment }.
export const adminShipOrder = (id) => post(`/api/admin/orders/${id}/ship`, {}).then((r) => r);
// Manual recovery: pull current AWB/status from Shiprocket and apply it. Returns { order }.
export const adminSyncShiprocket = (id) => get(`/api/admin/orders/${id}/sync-shiprocket`).then((r) => r.order);
// Admin override: file a return on a customer's behalf (no 7-day window check).
export const adminCreateReturn = (id, data) => post(`/api/admin/orders/${id}/return`, data).then((r) => r.return);
export const adminExportOrders = (params = {}) => get("/api/admin/orders/export", params);

// Admin · Reviews
export const adminGetReviews = (params = {}) => get("/api/admin/reviews", params).then((r) => r.reviews || []);
export const adminApproveReview = (id) => put(`/api/admin/reviews/${id}/approve`, {});
export const adminRejectReview = (id) => put(`/api/admin/reviews/${id}/reject`, {});
export const adminFeatureReview = (id, featured) => put(`/api/admin/reviews/${id}/feature`, { featured });

// Admin · Coupons
export const adminGetCoupons = () => get("/api/admin/coupons").then((r) => r.coupons || []);
export const adminCreateCoupon = (data) => post("/api/admin/coupons", data).then((r) => r.coupon);
export const adminUpdateCoupon = (id, data) => put(`/api/admin/coupons/${id}`, data).then((r) => r.coupon);
export const adminToggleCoupon = (id, active) => put(`/api/admin/coupons/${id}/toggle`, { active }).then((r) => r.coupon);

// Admin · Banners
export const adminGetBanners = () => get("/api/admin/banners").then((r) => r.banners || []);
export const adminCreateBanner = (data) => post("/api/admin/banners", data).then((r) => r.banner);
export const adminUpdateBanner = (id, data) => put(`/api/admin/banners/${id}`, data).then((r) => r.banner);
export const adminDeleteBanner = (id) => del(`/api/admin/banners/${id}`);
export const adminReorderBanners = (ids) => put("/api/admin/banners/reorder", { ids }).then((r) => r.banners || []);

// Admin · Bulk Enquiries
export const adminGetEnquiries = (params = {}) => get("/api/admin/enquiries", params).then((r) => r.enquiries || []);
export const adminUpdateEnquiry = (id, data) => put(`/api/admin/enquiries/${id}`, data).then((r) => r.enquiry);

// Admin · Master Data
export const adminGetMasterData = (tableName) => get(`/api/admin/master-data/${tableName}`).then((r) => r.rows || []);
export const adminAddMasterDataValue = (tableName, value) => post(`/api/admin/master-data/${tableName}`, { value }).then((r) => r.rows || []);
export const adminToggleMasterDataValue = (tableName, valueId, active) => put(`/api/admin/master-data/${tableName}/${valueId}`, { active }).then((r) => r.rows || []);

// Admin · Tags
export const adminGetTags = () => get("/api/admin/tags").then((r) => r.tags || []);
export const adminCreateTag = (data) => post("/api/admin/tags", data).then((r) => r.tag);
export const adminUpdateTag = (id, data) => put(`/api/admin/tags/${id}`, data).then((r) => r.tag);

// Admin · Dashboard
export const adminGetDashboard = () => get("/api/admin/dashboard");

// Admin · Store settings
export const adminGetSettings = () => get("/api/admin/settings").then((r) => r.settings);
export const adminSaveSettings = (data) => put("/api/admin/settings", data).then((r) => r.settings);
export const adminGetIntegrations = () => get("/api/admin/integrations").then((r) => r.integrations || []);

// Admin · Image upload (multipart)
export const adminUploadImage = (file) => {
  const fd = new FormData();
  fd.append("file", file);
  return uploadForm("/api/admin/upload", fd);
};
