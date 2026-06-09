import { NextResponse } from "next/server";
import { userFromRequest } from "@/lib/server/jwt";

/* Gate for admin routes. Returns { auth } on success, or { error: NextResponse }
   with 401 (not logged in) / 403 (not admin). Admin identity comes from a real
   JWT whose role is admin/superadmin (granted via Google OAuth + ADMIN_EMAIL).
   Usage:
     const { auth, error } = requireAdmin(req); if (error) return error; */
export function requireAdmin(req) {
  const auth = userFromRequest(req);
  if (!auth) return { error: NextResponse.json({ error: "Login required" }, { status: 401 }) };
  if (auth.role !== "admin" && auth.role !== "superadmin") {
    return { error: NextResponse.json({ error: "Admin access required" }, { status: 403 }) };
  }
  return { auth };
}
