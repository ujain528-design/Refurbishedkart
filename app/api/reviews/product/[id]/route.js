import { NextResponse } from "next/server";
import { productReviews } from "@/lib/server/products";

export const dynamic = "force-dynamic";

export async function GET(_req, { params }) {
  try {
    return NextResponse.json(await productReviews(params.id));
  } catch (e) {
    return NextResponse.json({ reviews: [], summary: { avg: 0, total: 0, breakdown: {} }, error: e.message }, { status: 500 });
  }
}
