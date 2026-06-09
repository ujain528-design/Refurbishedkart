import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Product } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";
import { calculateDeviceCost } from "@/lib/server/pricing";
import { validateProduct } from "@/lib/server/productValidation";

export const dynamic = "force-dynamic";

function withDeviceCost(data) {
  if (data.defaultRam && data.defaultSsd) {
    const lp = Number(data.listedPrice ?? data.price ?? 0);
    data.listedPrice = lp;
    data.price = lp;
    data.deviceCost = calculateDeviceCost(lp, data.defaultRam.cost, data.defaultSsd.cost);
  }
  return data;
}

export async function GET(req, { params }) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const product = await Product.findOne({ id: Number(params.id) }).lean();
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json({ product });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const raw = await req.json();
    const errors = validateProduct(raw);
    if (errors.length) return NextResponse.json({ error: errors.join("; "), errors }, { status: 400 });
    const data = withDeviceCost(raw);
    delete data._id;
    const product = await Product.findOneAndUpdate({ id: Number(params.id) }, { $set: data }, { new: true });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json({ product });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    await Product.deleteOne({ id: Number(params.id) });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
