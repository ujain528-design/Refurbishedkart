"use client";

import { useState } from "react";
import { PageHeader, useToast, inputCls, btnPrimary, btnGhost, Badge } from "@/components/admin/ui";
import { CATEGORY_SLUGS } from "@/lib/data";

const MOCK_VALIDATION = [
  { row: 2, name: "Dell Latitude 7420", ok: true },
  { row: 3, name: "HP EliteBook 840 G8", ok: true },
  { row: 4, name: "Lenovo ThinkPad X1", ok: true },
  { row: 5, name: "—", ok: false, error: "Processor value 'Intel Core i5-8250' not found in master data" },
  { row: 6, name: "Acer Aspire 5", ok: true },
  { row: 7, name: "—", ok: false, error: "Missing required field: Listed Price" },
  { row: 8, name: "—", ok: false, error: "Duplicate SKU: RK-AC-0042" },
];

export default function BulkUpload() {
  const toast = useToast();
  const [step, setStep] = useState(1);
  const valid = MOCK_VALIDATION.filter((r) => r.ok).length;
  const invalid = MOCK_VALIDATION.length - valid;

  return (
    <div>
      <PageHeader title="Bulk Upload" subtitle="Import products from a category Excel template." />

      <div className="max-w-3xl space-y-4">
        {/* Step 1 */}
        <div className="rounded-card border border-black/5 bg-white p-5 shadow-card">
          <p className="text-sm font-bold text-ink">Step 1 — Select category & download template</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <select className={`${inputCls} max-w-[200px]`}>{Object.values(CATEGORY_SLUGS).map((c) => <option key={c}>{c}</option>)}</select>
            <button onClick={() => toast("Template downloaded")} className={btnGhost}>Download Template</button>
          </div>
          <p className="mt-2 text-[12px] text-neutral-400">Template includes a second sheet listing all valid dropdown values for this category.</p>
        </div>

        {/* Step 2 */}
        <div className="rounded-card border border-black/5 bg-white p-5 shadow-card">
          <p className="text-sm font-bold text-ink">Step 2 — Upload filled Excel</p>
          <div onClick={() => setStep(3)} className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-black/15 py-8 text-center text-sm text-neutral-400 hover:border-brand">
            <span className="text-2xl">⬆</span>
            <span className="mt-1">Click to upload .xlsx</span>
          </div>
        </div>

        {/* Step 3 — validation */}
        {step >= 3 && (
          <div className="rounded-card border border-black/5 bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-ink">Step 3 — Validation results</p>
              <span className="text-[13px] text-neutral-500"><span className="font-bold text-brand">{valid} valid</span> · <span className="font-bold text-red-600">{invalid} invalid</span></span>
            </div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-[12px] uppercase tracking-wide text-neutral-400"><th className="px-3 py-2">Row</th><th className="px-3 py-2">Product</th><th className="px-3 py-2">Result</th></tr></thead>
                <tbody>
                  {MOCK_VALIDATION.map((r) => (
                    <tr key={r.row} className={r.ok ? "bg-brand-soft/30" : "bg-red-50"}>
                      <td className="px-3 py-2 font-mono text-[13px]">{r.row}</td>
                      <td className="px-3 py-2 text-ink">{r.name}</td>
                      <td className="px-3 py-2">{r.ok ? <Badge>valid</Badge> : <span className="text-[12px] font-semibold text-red-600">{r.error}</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setStep(4)} className={btnPrimary}>Import {valid} valid rows</button>
            </div>
          </div>
        )}

        {/* Step 4 — success */}
        {step >= 4 && (
          <div className="rounded-card border border-brand/20 bg-brand-softer p-5">
            <p className="text-sm font-bold text-brand">✓ {valid} products imported · {invalid} rows skipped</p>
            <button onClick={() => toast("Error report downloaded")} className="mt-3 text-[13px] font-bold text-brand hover:underline">Download error report</button>
          </div>
        )}
      </div>
    </div>
  );
}
