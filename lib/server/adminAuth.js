import { NextResponse } from "next/server";
import { userFromRequest, signJwt, verifyJwt } from "@/lib/server/jwt";

// httpOnly cookie holding the admin session JWT (custom ID/password auth).
export const ADMIN_COOKIE = "rk_admin";
const ADMIN_TTL_SEC = 8 * 60 * 60; // 8 hours

/* Sign an 8-hour admin session token. */
export function signAdminToken(adminId) {
  return signJwt({ sub: adminId, adminId, role: "admin", kind: "admin" }, ADMIN_TTL_SEC);
}

/* Attach / clear the httpOnly admin cookie on a NextResponse. */
export function setAdminCookie(res, token) {
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_TTL_SEC,
  });
  return res;
}
export function clearAdminCookie(res) {
  res.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}

/* Admin identity from the httpOnly cookie (full signature verification). */
export function adminFromRequest(req) {
  const token = req.cookies?.get?.(ADMIN_COOKIE)?.value;
  if (!token) return null;
  const payload = verifyJwt(token);
  if (payload && (payload.role === "admin" || payload.role === "superadmin")) return payload;
  return null;
}

/* Gate for admin API routes. Returns { auth } on success, or { error: NextResponse }
   with 401 / 403. Primary path is the new admin cookie; the legacy Bearer-token
   path (Google OAuth + ADMIN_EMAIL) is kept as a fallback so nothing breaks.
   Usage: const { auth, error } = requireAdmin(req); if (error) return error; */
export function requireAdmin(req) {
  const admin = adminFromRequest(req);
  if (admin) return { auth: admin };

  const auth = userFromRequest(req);
  if (!auth) return { error: NextResponse.json({ error: "Login required" }, { status: 401 }) };
  if (auth.role !== "admin" && auth.role !== "superadmin") {
    return { error: NextResponse.json({ error: "Admin access required" }, { status: 403 }) };
  }
  return { auth };
}
