import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Product } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";
import { getPricingConfig } from "@/lib/server/pricing";
import { recomputeProductPricing } from "@/lib/server/pricing-core";

export const dynamic = "force-dynamic";

/* Missing-table flags for a product given its recomputed result. A non-empty
   capacity that prices to ₹0 after recompute means that RAM/SSD size isn't in the
   global pricing table → it would silently cost ₹0. */
function missingFlags(p, r) {
  const ramCap = String(p.defaultRam?.capacity || "").trim();
  const ssdCap = String(p.defaultSsd?.capacity || "").trim();
  const missingRam = ramCap !== "" && r.defaultRamCost === 0;
  const missingSsd = ssdCap !== "" && r.defaultSsdCost === 0;
  return { missingRam, missingSsd, missingTable: missingRam || missingSsd };
}

/* POST — recompute every product's pricing against the current PricingConfig.
   For each product: refresh defaultRam.cost + defaultSsd.cost from the tables
   (fixes stale/zero costs), recompute listedPrice = deviceCost + ramCost + ssdCost,
   and recalculate every configs[].price. Returns { updated, skipped, errors }.

   ?dryRun=true → compute the same new values but write NOTHING; return a
   before/after comparison plus a change summary, so the admin can preview first.

   Live (dryRun=false) is GUARDED: if any product has a missing pricing-table
   entry, nothing is written and a 409 is returned — unless the request body
   contains { force: true } as an explicit override. */
export async function POST(req) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const cfg = await getPricingConfig();
    const products = await Product.find({}).lean();
    const dryRun = req.nextUrl.searchParams.get("dryRun") === "true";
    const body = await req.json().catch(() => ({}));
    const force = body?.force === true;

    // ── Dry run: no writes, return before/after for every repriceable product ──
    if (dryRun) {
      const rows = [];
      let willChange = 0, skipped = 0, missing = 0;
      for (const p of products) {
        const r = recomputeProductPricing(p, cfg);
        if (!r) { skipped++; continue; }
        const before = {
          listedPrice: Number(p.listedPrice ?? p.price ?? 0),
          defaultRamCost: Number(p.defaultRam?.cost ?? 0),
          defaultSsdCost: Number(p.defaultSsd?.cost ?? 0),
        };
        const after = {
          listedPrice: r.listedPrice,
          defaultRamCost: r.defaultRamCost,
          defaultSsdCost: r.defaultSsdCost,
        };
        const delta = after.listedPrice - before.listedPrice;
        const configsChanged = JSON.stringify((p.configs || []).map((c) => c.price)) !== JSON.stringify(r.configs.map((c) => c.price));
        const changed = delta !== 0 || configsChanged;
        if (changed) willChange += 1;

        const { missingRam, missingSsd, missingTable } = missingFlags(p, r);
        if (missingTable) missing += 1;

        rows.push({
          id: p.id,
          name: p.name,
          before,
          after,
          delta,
          changed,
          missingTable,
          missingRam,
          missingSsd,
          tableWarning: missingTable ? "missing_table_entry" : "",
          warning: delta !== 0 ? "Listed price will change" : configsChanged ? "Config prices will change" : "",
        });
      }
      return NextResponse.json({
        dryRun: true,
        products: rows,
        summary: { total: rows.length, willChange, unchanged: rows.length - willChange, skipped, missing },
      });
    }

    // ── Live recompute: compute everything first, then GUARD before any write ──
    const computed = [];     // { p, r } for repriceable products
    const missingList = [];  // products with a missing table entry
    for (const p of products) {
      const r = recomputeProductPricing(p, cfg);
      if (!r) continue;
      const { missingRam, missingSsd, missingTable } = missingFlags(p, r);
      if (missingTable) missingList.push({ id: p.id, name: p.name, missingRam, missingSsd, tableWarning: "missing_table_entry" });
      computed.push({ p, r });
    }

    if (!force && missingList.length) {
      return NextResponse.json(
        {
          error: "missing_table_entries",
          message: `${missingList.length} product${missingList.length === 1 ? "" : "s"} have RAM/SSD capacities not in pricing table. Fix the table first or pass force=true to override.`,
          products: missingList,
        },
        { status: 409 }
      );
    }

    let updated = 0;
    const errors = [];
    for (const { p, r } of computed) {
      try {
        await Product.updateOne(
          { id: p.id },
          {
            $set: {
              listedPrice: r.listedPrice,
              price: r.listedPrice,
              "defaultRam.cost": r.defaultRamCost,
              "defaultSsd.cost": r.defaultSsdCost,
              configs: r.configs,
            },
          }
        );
        updated++;
      } catch (e) {
        errors.push({ id: p.id, name: p.name, error: e.message });
      }
    }

    return NextResponse.json({ updated, skipped: products.length - computed.length, errors, forced: force });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
