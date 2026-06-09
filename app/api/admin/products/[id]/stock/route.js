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

    const product = await Product.findOne({ id: Number(params.id) }).lean();
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const current = product.chassisStock ?? product.stock ?? 0;
    if (action === "decrease" && current - qty < 0) {
      return NextResponse.json({ error: "Cannot go below 0" }, { status: 400 });
    }
    const next = action === "decrease" ? current - qty : current + qty;

    // Use $set via findOneAndUpdate — chassisStock/stock are NOT declared schema
    // paths (Product is strict:false), so a `doc.field = x; doc.save()` would NOT
    // be tracked as modified and would silently persist nothing. $set writes reliably.
    const updated = await Product.findOneAndUpdate(
      { id: Number(params.id) },
      { $set: { chassisStock: next, stock: next } }, // stock mirrored for storefront/legacy reads
      { new: true }
    ).lean();

    return NextResponse.json({ product: updated });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
