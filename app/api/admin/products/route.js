import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Product } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";
import { calculateDeviceCost } from "@/lib/server/pricing";
import { validateProduct } from "@/lib/server/productValidation";

export const dynamic = "force-dynamic";

// Back-calculate + store deviceCost when the default config is defined.
function withDeviceCost(data) {
  if (data.defaultRam && data.defaultSsd) {
    const lp = Number(data.listedPrice ?? data.price ?? 0);
    data.listedPrice = lp;
    data.price = lp; // mirror for storefront/legacy reads
    data.deviceCost = calculateDeviceCost(lp, data.defaultRam.cost, data.defaultSsd.cost);
  }
  return data;
}

export async function GET(req) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const sp = req.nextUrl.searchParams;
    const q = sp.get("q"), category = sp.get("category"), limit = Number(sp.get("limit") || 0), page = Number(sp.get("page") || 1);
    let rows = await Product.find({}).sort({ id: 1 }).lean();
    if (category) rows = rows.filter((p) => p.category === category);
    if (q) {
      const t = q.toLowerCase();
      rows = rows.filter((p) => `${p.name} ${p.brand} ${p.specs || ""}`.toLowerCase().includes(t));
    }
    const total = rows.length;
    if (limit) rows = rows.slice((page - 1) * limit, page * limit);
    return NextResponse.json({ products: rows, total, page, limit });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const raw = await req.json();
    const errors = validateProduct(raw);
    if (errors.length) return NextResponse.json({ error: errors.join("; "), errors }, { status: 400 });
    const data = withDeviceCost(raw);
    let id = Number(data.id);
    if (!id) {
      const last = await Product.findOne({}).sort({ id: -1 }).lean();
      id = (last?.id || 0) + 1;
    }
    const doc = await Product.findOneAndUpdate({ id }, { $set: { ...data, id } }, { new: true, upsert: true });
    return NextResponse.json({ product: doc }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
