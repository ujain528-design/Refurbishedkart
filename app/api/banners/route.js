import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";

export async function GET() {
  const banners = db().banners.filter((b) => b.active).sort((a, b) => a.order - b.order);
  return NextResponse.json({ banners });
}
