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

// Coupons
export const applyCoupon = (code, subtotal, category) =>
  post("/api/coupons/apply", { code, subtotal, category });

// Bulk enquiry
export const submitBulkEnquiry = (data) => post("/api/bulk-enquiry", data);

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
