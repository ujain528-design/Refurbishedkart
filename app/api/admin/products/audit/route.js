import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Product } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";
import { validateProduct } from "@/lib/server/productValidation";

export const dynamic = "force-dynamic";

/* GET /api/admin/products/audit (admin only)
   Scans every product against the required-field rules and reports the ones with
   problems — so you can find/fix bad rows (e.g. missing category) that predate
   validation or arrived via bulk upload. Read-only; changes nothing. */
export async function GET(req) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const products = await Product.find({}).sort({ id: 1 }).lean();

    const invalid = products
      .map((p) => ({ id: p.id, name: p.name || p.model || "(unnamed)", category: p.category ?? null, issues: validateProduct(p) }))
      .filter((r) => r.issues.length > 0);

    const missingCategory = invalid.filter((r) => r.issues.includes("Category is required"));

    // The most urgent data-quality issue: products whose effective price
    // (price, falling back to listedPrice) is missing or <= 0. These render as
    // "₹0" on storefront cards — a silent, customer-facing failure.
    const zeroPriceProducts = products
      .filter((p) => (Number(p.price ?? p.listedPrice ?? 0) || 0) <= 0)
      .map((p) => ({
        id: p.id,
        name: p.name || p.model || "(unnamed)",
        brand: p.brand ?? null,
        price: p.price ?? null,
        listedPrice: p.listedPrice ?? null,
      }));

    // Products the price migration flagged with a ₹1 placeholder (needsPricing:true).
    // These no longer show ₹0, but ₹1 is still wrong — this is the list to drive to
    // zero by setting a real price in the editor. The TRUE data-quality finish line.
    const needsPricingProducts = products
      .filter((p) => p.needsPricing === true)
      .map((p) => ({
        id: p.id,
        name: p.name || p.model || "(unnamed)",
        brand: p.brand ?? null,
        price: p.price ?? null,
        listedPrice: p.listedPrice ?? null,
      }));

    return NextResponse.json({
      totalProducts: products.length,
      invalidCount: invalid.length,
      missingCategoryCount: missingCategory.length,
      zeroPriceCount: zeroPriceProducts.length,
      needsPricingCount: needsPricingProducts.length,
      zeroPriceProducts,    // would show ₹0 to customers — fix first
      needsPricingProducts, // ₹1 placeholders awaiting a real price — fix to reach clean data
      missingCategory,      // products missing a category
      invalid,              // all products failing any required-field rule
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
