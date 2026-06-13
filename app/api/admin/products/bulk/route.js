import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Product } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";
import {
  loadValidationContext, validateRows, validateRow, buildProductDoc, addMasterValue, CATEGORY_LIST,
} from "@/lib/server/bulkImport";
import { assignUniqueSlug } from "@/lib/server/slug";

export const dynamic = "force-dynamic";

/* Bulk product import. Body: { category, rows: [...record objects...], mode }.
   mode "validate" → three-state preview (valid / new / error), no writes.
   mode "import"   → RE-VALIDATES; error rows skipped; valid + new-value rows
   created — and any typed master-data overrides (new brand/OS/warranty/processor)
   are ADDED to their master table first so they become reusable. No images. */
export async function POST(req) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const { category, rows, mode = "validate" } = await req.json();

    if (!CATEGORY_LIST.includes(category)) {
      return NextResponse.json({ error: `Unknown category '${category}'` }, { status: 400 });
    }
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No rows to process" }, { status: 400 });
    }

    const ctx = await loadValidationContext();

    if (mode === "validate") {
      const preview = validateRows(category, rows, ctx);
      return NextResponse.json({
        category,
        preview,
        validCount: preview.filter((r) => r.rowState === "valid").length,
        newCount: preview.filter((r) => r.rowState === "new").length,
        errorCount: preview.filter((r) => r.rowState === "error").length,
      });
    }

    // mode === "import"
    const last = await Product.findOne({}).sort({ id: -1 }).lean();
    let nextId = (last?.id || 0) + 1;

    const results = [];
    const addedValues = []; // { table, value } actually appended to master data
    const seen = new Set();
    let imported = 0, skipped = 0;

    for (const rec of rows) {
      const v = validateRow(category, rec, ctx);
      if (v.rowState === "error") {
        skipped++;
        results.push({ row: v.row, name: v.name, ok: false, state: "error", error: v.error, errors: v.errors });
        continue;
      }
      // Grow master data for typed overrides (dedupe across the batch).
      for (const n of v.news) {
        const key = `${n.table}::${String(n.value).toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const did = await addMasterValue(n.table, n.value);
        if (did) addedValues.push({ table: n.table, value: n.value });
      }
      const doc = buildProductDoc(category, rec, ctx, nextId);
      // Unique SEO slug — assigned after each insert so same-batch bases dedupe.
      doc.slug = await assignUniqueSlug(doc);
      await Product.findOneAndUpdate({ id: nextId }, { $set: doc }, { new: true, upsert: true });
      results.push({ row: v.row, name: v.name, ok: true, state: v.rowState, id: nextId, price: doc.listedPrice });
      nextId++;
      imported++;
    }

    return NextResponse.json({ category, imported, skipped, addedValues, results });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
