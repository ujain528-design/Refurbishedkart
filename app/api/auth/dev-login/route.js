import { NextResponse } from "next/server";
import { db, save } from "@/lib/server/db";
import { signJwt } from "@/lib/server/jwt";

/* DEV ONLY — stands in for Google OAuth, which needs real Google client
   credentials + redirect URIs. Issues a token for a demo superadmin so both
   the storefront and the admin panel stay testable. Replace with the real
   /api/auth/google OAuth flow when credentials exist. */
export async function POST() {
  const id = "demo-superadmin";
  db().users[id] = { id, name: "Utkarsh Jain", email: "ujain528@gmail.com", phone: "+91 98765 43210", addresses: [], role: "superadmin" };
  save();
  const token = signJwt({ sub: id, name: "Utkarsh Jain", email: "ujain528@gmail.com", role: "superadmin" });
  return NextResponse.json({ token });
}
