"use client";

import { useRef, useState } from "react";
import { PageHeader, useToast, inputCls, btnPrimary, btnGhost, Badge } from "@/components/admin/ui";
import { CATEGORIES, CONDITIONS, columnKeys } from "@/lib/bulkTemplates";
import { buildTemplateBlob, parseWorkbook } from "@/lib/xlsxClient";
import { adminGetMasterData, adminGetPricingConfig, adminBulkValidate, adminBulkImport } from "@/lib/api";
import { PROCESSOR_MODELS } from "@/lib/admin-data";

const activeVals = (rows) => (rows || []).filter((r) => r.active !== false).map((r) => r.value);
const STATE_LABEL = { valid: "valid", new: "new value", error: "error" };

export default function BulkUpload() {
  const toast = useToast();
  const fileRef = useRef(null);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [fileName, setFileName] = useState("");
  const [records, setRecords] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const reset = () => { setRecords(null); setPreview(null); setResult(null); setFileName(""); if (fileRef.current) fileRef.current.value = ""; };

  const downloadTemplate = async () => {
    setDownloading(true);
    try {
      // Pull dropdown sources LIVE at generation time.
      const [brands, os, warranty, ramType, panel, ramExp, aspect, serverFF, cfg] = await Promise.all([
        adminGetMasterData("Brands").catch(() => []),
        adminGetMasterData("Operating System").catch(() => []),
        adminGetMasterData("Warranty Period").catch(() => []),
        adminGetMasterData("RAM Type").catch(() => []),
        adminGetMasterData("Panel Type").catch(() => []),
        adminGetMasterData("RAM Expandability").catch(() => []),
        adminGetMasterData("Aspect Ratio").catch(() => []),
        adminGetMasterData("Server Form Factor").catch(() => []),
        adminGetPricingConfig().catch(() => ({ ram: {}, ssd: {} })),
      ]);
      const ramCaps = [...new Set(
        Object.values(cfg.ram || {}).flatMap((t) => Object.entries(t || {}).filter(([, p]) => Number(p) > 0).map(([gb]) => gb))
      )].map((gb) => `${gb}GB`).sort((a, b) => parseInt(a) - parseInt(b));
      const sources = {
        category: CATEGORIES,
        condition: CONDITIONS,
        brand: activeVals(brands),
        os: activeVals(os),
        warranty: activeVals(warranty),
        ram: ramCaps,
        ssd: Object.keys(cfg.ssd || {}),
        processor: [...new Set(Object.values(PROCESSOR_MODELS).flat())],
        ramType: activeVals(ramType),
        panel: activeVals(panel),
        ramExp: activeVals(ramExp),
        aspectRatio: activeVals(aspect),
        serverFF: activeVals(serverFF),
      };
      const blob = await buildTemplateBlob(category, sources);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `refurbishedkart-${category.toLowerCase()}-template.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast(`${category} template downloaded`);
    } catch (e) {
      toast(e.message || "Couldn't build template", "error");
    } finally {
      setDownloading(false);
    }
  };

  const onFile = async (file) => {
    if (!file) return;
    setResult(null); setPreview(null);
    setFileName(file.name);
    setBusy(true);
    try {
      const buf = await file.arrayBuffer();
      const { records: recs } = await parseWorkbook(buf);
      if (!recs.length) { toast("No data rows found (data starts at row 3)", "error"); setRecords(null); return; }
      setRecords(recs);
      const res = await adminBulkValidate(category, recs);
      setPreview(res);
    } catch (e) {
      toast(e.message || "Couldn't read the file", "error");
    } finally {
      setBusy(false);
    }
  };

  const runImport = async () => {
    if (!records) return;
    setBusy(true);
    try {
      const res = await adminBulkImport(category, records);
      setResult(res);
      toast(`${res.imported} imported · ${res.skipped} skipped`);
    } catch (e) {
      toast(e.message || "Import failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const importable = (preview?.validCount ?? 0) + (preview?.newCount ?? 0);

  const detailOf = (r) => {
    if (r.rowState === "error") return r.errors.join("; ");
    if (r.rowState === "new") return r.cells.filter((c) => c.state === "new").map((c) => c.reason).join("; ");
    return "All values recognised";
  };
  const rowTint = (s) => (s === "error" ? "bg-red-50/70" : s === "new" ? "bg-amber-50/70" : "");
  const stateChip = (s) =>
    s === "error" ? <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700">ERROR</span>
      : s === "new" ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">NEW VALUE</span>
      : <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">VALID</span>;

  return (
    <div>
      <PageHeader title="Bulk Upload" subtitle="Import products from a per-category Excel template. Specs & ports only — add images per-product afterwards." />

      <div className="max-w-3xl space-y-4">
        {/* Step 1 — category + template */}
        <div className="rounded-card border border-black/5 bg-white p-5 shadow-card">
          <p className="text-sm font-bold text-ink">Step 1 — Select category &amp; download template</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <select value={category} onChange={(e) => { setCategory(e.target.value); reset(); }} className={`${inputCls} max-w-[220px]`}>
              {CATEGORIES.map((cName) => <option key={cName}>{cName}</option>)}
            </select>
            <button onClick={downloadTemplate} disabled={downloading} className={btnGhost}>{downloading ? "Building…" : `Download ${category} .xlsx`}</button>
          </div>
          <p className="mt-2 text-[12px] text-neutral-400">
            Grouped headers (row 1), field names (row 2), one example (row 3), frozen top rows. Brand / RAM / OS / condition / warranty cells have dropdowns — typing a custom value is allowed (it becomes a new master value on import). The category cell is locked to the 5 categories. The PORTS group has one number column per port type.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {columnKeys(category).map((k) => (
              <span key={k} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600">{k}</span>
            ))}
          </div>
        </div>

        {/* Step 2 — upload */}
        <div className="rounded-card border border-black/5 bg-white p-5 shadow-card">
          <p className="text-sm font-bold text-ink">Step 2 — Upload filled .xlsx</p>
          <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-black/15 py-8 text-center text-sm text-neutral-400 hover:border-brand">
            <input ref={fileRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            <span className="text-2xl">⬆</span>
            <span className="mt-1">{fileName || "Click to upload .xlsx"}</span>
          </label>
          {records && <p className="mt-2 text-[12px] text-neutral-500">{records.length} data row{records.length > 1 ? "s" : ""} read{busy && !preview ? " — validating…" : ""}.</p>}
        </div>

        {/* Step 3 — three-state preview */}
        {preview && (
          <div className="rounded-card border border-black/5 bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-ink">Step 3 — Validation preview</p>
              <span className="text-[13px]">
                <span className="font-bold text-emerald-600">{preview.validCount} valid</span> · <span className="font-bold text-amber-600">{preview.newCount} new</span> · <span className="font-bold text-red-600">{preview.errorCount} error</span>
              </span>
            </div>
            <div className="mt-3 max-h-[440px] overflow-auto rounded-lg border border-black/5">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-neutral-50"><tr className="text-left text-[12px] uppercase tracking-wide text-neutral-400">
                  <th className="px-3 py-2">Row</th><th className="px-3 py-2">Product</th><th className="px-3 py-2">State</th><th className="px-3 py-2">Detail</th>
                </tr></thead>
                <tbody>
                  {preview.preview.map((r) => (
                    <tr key={r.row} className={`border-t border-black/5 ${rowTint(r.rowState)}`}>
                      <td className="px-3 py-2 font-mono text-[13px] text-neutral-500">{r.row}</td>
                      <td className="px-3 py-2 font-medium text-ink">{r.name}</td>
                      <td className="px-3 py-2">{stateChip(r.rowState)}</td>
                      <td className={`px-3 py-2 text-[12px] ${r.rowState === "error" ? "font-semibold text-red-600" : r.rowState === "new" ? "text-amber-700" : "text-neutral-400"}`}>{detailOf(r)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <button onClick={runImport} disabled={busy || importable === 0} className={`${btnPrimary} disabled:cursor-not-allowed disabled:opacity-40`}>
                {busy ? "Importing…" : `Import ${importable} row${importable === 1 ? "" : "s"}`}
              </button>
              <button onClick={reset} className={btnGhost}>Clear</button>
              {preview.errorCount > 0 && <span className="text-[12px] text-neutral-400">{preview.errorCount} error row{preview.errorCount === 1 ? "" : "s"} will be skipped.</span>}
            </div>
            <p className="mt-2 text-[11px] text-neutral-400">Amber “new value” rows import and add the typed value (brand / OS / warranty / processor) to its master list. New RAM/SSD sizes import at ₹0 component cost (no pricing entry).</p>
          </div>
        )}

        {/* Step 4 — result */}
        {result && (
          <div className="rounded-card border border-brand/20 bg-brand-softer p-5">
            <p className="text-sm font-bold text-brand">✓ {result.imported} product{result.imported === 1 ? "" : "s"} imported · {result.skipped} skipped</p>
            {result.addedValues?.length > 0 && (
              <p className="mt-2 text-[12px] text-neutral-600">Added to master data: {result.addedValues.map((a) => `${a.value} (${a.table})`).join(", ")}</p>
            )}
            {result.skipped > 0 && (
              <div className="mt-3">
                <p className="text-[12px] font-semibold text-neutral-600">Skipped rows:</p>
                <ul className="mt-1 space-y-1">
                  {result.results.filter((r) => !r.ok).map((r) => (
                    <li key={r.row} className="text-[12px] text-red-700">Row {r.row} ({r.name}): {r.error}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <a href="/admin/products" className={btnPrimary}>View products</a>
              <button onClick={reset} className={btnGhost}>Import another file</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
