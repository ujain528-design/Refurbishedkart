import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Product } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";

export const dynamic = "force-dynamic";

/* Chassis is the ONLY stock pool (all configs share it). No per-component pools.
   PUT body: { action: "add"|"decrease", quantity: number } (type is ignored /
   accepted for back-compat). Clamped at 0. `stock` is mirrored to chassisStock
   so the storefront card + legacy reads stay consistent. */
export async function PUT(req, { params }) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const { action, quantity } = await req.json();
    const qty = Math.max(0, Math.floor(Number(quantity) || 0));
    const delta = action === "decrease" ? -qty : qty;

    const product = await Product.findOne({ id: Number(params.id) });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const current = product.chassisStock ?? product.stock ?? 0;
    const next = Math.max(0, current + delta);
    product.chassisStock = next;
    product.stock = next; // mirror
    await product.save();

    return NextResponse.json({ product: product.toObject() });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
