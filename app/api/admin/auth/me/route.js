import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/adminAuth";

export const dynamic = "force-dynamic";

/* Current admin identity (for the admin shell header). */
export async function GET(req) {
  const { auth, error } = requireAdmin(req);
  if (error) return error;
  return NextResponse.json({ adminId: auth.adminId || auth.sub || null, role: auth.role });
}
