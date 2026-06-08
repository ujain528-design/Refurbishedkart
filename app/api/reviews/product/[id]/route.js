import { NextResponse } from "next/server";
import { productReviews } from "@/lib/server/products";

export async function GET(_req, { params }) {
  return NextResponse.json(productReviews(params.id));
}
