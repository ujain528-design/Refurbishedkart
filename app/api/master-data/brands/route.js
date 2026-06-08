import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

export async function GET() {
  const brands = [...new Set(db().products.map((p) => p.brand))].sort();
  return NextResponse.json({ brands });
}
