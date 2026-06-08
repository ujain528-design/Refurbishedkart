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
export const del = (url) => request("DELETE", url);
