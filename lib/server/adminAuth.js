import { NextResponse } from "next/server";
import { userFromRequest } from "@/lib/server/jwt";

/* ⚠️ DEV-ONLY AUTH BYPASS — REMOVE BEFORE PRODUCTION ⚠️
   When running `next dev` (NODE_ENV === "development") AND the request carries no
   Authorization header, we grant access as a mock superadmin so the admin panel
   can be exercised without Google OAuth. This is INERT in production builds
   (NODE_ENV === "production") and does NOT fire when a real Bearer token is sent,
   so genuine logins still flow through the normal check below. */
const DEV_BYPASS = process.env.NODE_ENV === "development";
const DEV_ADMIN = { sub: "dev-admin", name: "Dev Admin", email: "dev@local", role: "superadmin" };

/* Gate for admin routes. Returns { auth } on success, or { error: NextResponse }
   with 401 (not logged in) / 403 (not admin). Usage:
     const { auth, error } = requireAdmin(req); if (error) return error; */
export function requireAdmin(req) {
  const hasAuthHeader = !!req.headers.get("authorization");

  // Dev convenience: no token in development → mock superadmin.
  if (DEV_BYPASS && !hasAuthHeader) {
    return { auth: DEV_ADMIN, devBypass: true };
  }

  const auth = userFromRequest(req);
  if (!auth) return { error: NextResponse.json({ error: "Login required" }, { status: 401 }) };
  if (auth.role !== "admin" && auth.role !== "superadmin") {
    return { error: NextResponse.json({ error: "Admin access required" }, { status: 403 }) };
  }
  return { auth };
}
