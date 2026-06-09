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

  const res = await fetch(full, { method, headers, body: data ? JSON.stringify(data) : undefined });

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
export const cancelOrder = (id) => post(`/api/orders/${id}/cancel`, {}).then((r) => r.order);

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

// Coupons
export const applyCoupon = (code, subtotal, category) =>
  post("/api/coupons/apply", { code, subtotal, category });

// Bulk enquiry
export const submitBulkEnquiry = (data) => post("/api/bulk-enquiry", data);

// Payments (Razorpay)
export const createRazorpayOrder = (orderId, amount) => post("/api/payment/create-order", { orderId, amount });
export const verifyPayment = (data) => post("/api/payment/verify", data);

// Public content (storefront consumes admin-managed collections/settings)
export const getBanners = () => get("/api/banners").then((r) => r.banners || []);
export const getAnnouncement = () => get("/api/content/announcement");
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

// Admin · Products
export const adminGetProducts = (params = {}) => get("/api/admin/products", params).then((r) => r.products || []);
export const adminGetProduct = (id) => get(`/api/admin/products/${id}`).then((r) => r.product);
export const adminCreateProduct = (data) => post("/api/admin/products", data).then((r) => r.product);
export const adminUpdateProduct = (id, data) => put(`/api/admin/products/${id}`, data).then((r) => r.product);
export const adminDeleteProduct = (id) => del(`/api/admin/products/${id}`);
export const adminUpdateStock = (id, body) => put(`/api/admin/products/${id}/stock`, body).then((r) => r.product);
export const adminBulkUpload = async (category, file) => {
  const fd = new FormData();
  fd.append("category", category);
  fd.append("file", file);
  return uploadForm("/api/admin/products/bulk", fd);
};

// Admin · Pricing
export const adminGetPricingConfig = () => get("/api/admin/pricing");
export const adminUpdateRamPricing = (data) => put("/api/admin/pricing/ram", data);
export const adminUpdateSsdPricing = (data) => put("/api/admin/pricing/ssd", data);
export const adminUpdateSettings = (data) => put("/api/admin/pricing/settings", data);

// Admin · Orders
export const adminGetOrders = (params = {}) => get("/api/admin/orders", params).then((r) => r.orders || []);
export const adminGetOrder = (id) => get(`/api/admin/orders/${id}`).then((r) => r.order);
export const adminUpdateOrderStatus = (id, status) => put(`/api/admin/orders/${id}/status`, { status }).then((r) => r.order);
export const adminUpdateTracking = (id, data) => put(`/api/admin/orders/${id}/tracking`, data).then((r) => r.order);
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

// Admin · Image upload (multipart)
export const adminUploadImage = (file) => {
  const fd = new FormData();
  fd.append("file", file);
  return uploadForm("/api/admin/upload", fd);
};
