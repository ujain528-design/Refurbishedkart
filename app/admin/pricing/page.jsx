"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader, Modal, useToast, btnPrimary, btnGhost } from "@/components/admin/ui";
import { RAM_PRICE_MATRIX, SSD_PRICE_TABLE } from "@/lib/admin-data";
import { adminGetPricingConfig, adminUpdateRamPricing, adminUpdateSsdPricing, adminRecomputeAllPrices } from "@/lib/api";

const cellCls = "w-20 rounded border border-black/10 px-2 py-1 text-center text-[13px] focus:border-brand focus:outline-none";

export default function PricingControl() {
  const toast = useToast();
  const [ram, setRam] = useState({});   // { [type]: { [cap]: value } }
  const [ssd, setSsd] = useState({});   // { [cap]: value }
  const [status, setStatus] = useState("loading");
  const [confirm, setConfirm] = useState(null); // "ram" | "ssd"
  const [saving, setSaving] = useState(false);
  const [recomputing, setRecomputing] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState(null); // dryRun result
  const [blocked, setBlocked] = useState(null); // 409 body { message, products } from the server guard

  const doPreview = async () => {
    setPreviewing(true);
    try {
      const res = await adminRecomputeAllPrices(true);
      setPreview(res);
    } catch (e) {
      toast(e.message || "Preview failed", "error");
    } finally {
      setPreviewing(false);
    }
  };

  const recomputeAll = async (force = false) => {
    setPreview(null);
    setRecomputing(true);
    try {
      const res = await adminRecomputeAllPrices(false, force);
      setBlocked(null);
      const errs = res?.errors?.length || 0;
      toast(`✓ Updated ${res?.updated ?? 0} product${res?.updated === 1 ? "" : "s"}${errs ? ` — ${errs} error${errs === 1 ? "" : "s"}` : ""}`, errs ? "error" : "success");
    } catch (e) {
      // Server guard: missing pricing-table entries → show the block modal with the
      // affected products and a force-override option.
      if (e?.status === 409 && e?.body?.error === "missing_table_entries") {
        setBlocked(e.body);
      } else {
        toast(e.message || "Recompute failed", "error");
      }
    } finally {
      setRecomputing(false);
    }
  };

  const inr = (n) => "₹" + Math.round(Number(n) || 0).toLocaleString("en-IN");

  // Load the saved tables from the DB; fall back to the static matrix per cell so
  // blanks are pre-filled with sensible starting values the admin can edit.
  const load = useCallback(() => {
    setStatus("loading");
    adminGetPricingConfig()
      .then((c) => {
        const r = {};
        RAM_PRICE_MATRIX.types.forEach((t) => {
          r[t] = {};
          RAM_PRICE_MATRIX.caps.forEach((cap) => {
            r[t][cap] = c.ram?.[t]?.[cap] ?? RAM_PRICE_MATRIX.prices[t]?.[cap] ?? "";
          });
        });
        const s = {};
        SSD_PRICE_TABLE.forEach(({ cap, price }) => {
          s[cap] = c.ssd?.[cap] ?? price ?? "";
        });
        setRam(r);
        setSsd(s);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);
  useEffect(() => { load(); }, [load]);

  const setRamCell = (t, cap, v) => setRam((s) => ({ ...s, [t]: { ...s[t], [cap]: v } }));
  const setSsdCell = (cap, v) => setSsd((s) => ({ ...s, [cap]: v }));

  // Build a clean numeric table for the API; omit blank/0 cells so they don't
  // persist as zeros (which would make those upgrades free).
  const buildRam = () => {
    const table = {};
    RAM_PRICE_MATRIX.types.forEach((t) => {
      RAM_PRICE_MATRIX.caps.forEach((cap) => {
        const n = Number(ram[t]?.[cap]);
        if (n > 0) { table[t] = table[t] || {}; table[t][cap] = n; }
      });
    });
    return table;
  };
  const buildSsd = () => {
    const table = {};
    SSD_PRICE_TABLE.forEach(({ cap }) => { const n = Number(ssd[cap]); if (n > 0) table[cap] = n; });
    return table;
  };

  const doSave = async () => {
    const which = confirm;
    setConfirm(null);
    setSaving(true);
    try {
      const res = which === "ram"
        ? await adminUpdateRamPricing({ ram: buildRam() })
        : await adminUpdateSsdPricing({ ssd: buildSsd() });
      toast(`${which === "ram" ? "RAM" : "SSD"} prices saved${res?.updated != null ? ` — ${res.updated} listing${res.updated === 1 ? "" : "s"} repriced` : ""}`);
    } catch (e) {
      toast(e.message || "Save failed — prices not updated", "error");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading") return <div className="py-24 text-center text-sm text-neutral-400">Loading pricing…</div>;
  if (status === "error") return (
    <div className="py-24 text-center">
      <p className="text-sm font-semibold text-red-600">Couldn&apos;t load pricing.</p>
      <button onClick={load} className={`${btnPrimary} mt-4`}>Retry</button>
    </div>
  );

  return (
    <div>
      <PageHeader title="Pricing Control" subtitle="Global component prices — one change propagates to all listings." />

      {/* Recompute — refresh every product's stored prices against the current tables.
          Click after any pricing change (or to fix stale RAM/SSD costs on old products). */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-card border border-brand/20 bg-brand-softer/40 p-4">
        <div>
          <p className="text-sm font-bold text-ink">Recompute All Product Prices</p>
          <p className="text-[12px] text-neutral-500">Refreshes default RAM/SSD costs, listed prices and every config from the current tables. Run this after editing prices.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={doPreview} disabled={previewing || recomputing} className={`${btnGhost} disabled:opacity-50`}>
            {previewing ? "Previewing…" : "Preview Changes"}
          </button>
          <button onClick={() => recomputeAll()} disabled={recomputing || previewing} className={`${btnPrimary} disabled:opacity-50`}>
            {recomputing ? "Recomputing…" : "Recompute All Prices"}
          </button>
        </div>
      </div>

      {/* RAM matrix */}
      <div className="mb-6 rounded-card border border-black/5 bg-white p-5 shadow-card">
        <h2 className="text-sm font-bold text-ink">RAM Price Matrix (type × capacity)</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="text-sm">
            <thead><tr className="text-[12px] uppercase tracking-wide text-neutral-400"><th className="px-3 py-2 text-left">Type</th>{RAM_PRICE_MATRIX.caps.map((c) => <th key={c} className="px-3 py-2">{c}GB</th>)}</tr></thead>
            <tbody>
              {RAM_PRICE_MATRIX.types.map((t) => (
                <tr key={t}><td className="px-3 py-2 font-semibold text-ink">{t}</td>
                  {RAM_PRICE_MATRIX.caps.map((c) => (
                    <td key={c} className="px-2 py-1.5">
                      <input
                        type="number"
                        value={ram[t]?.[c] ?? ""}
                        onChange={(e) => setRamCell(t, c, e.target.value)}
                        className={cellCls}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={() => setConfirm("ram")} disabled={saving} className={`${btnPrimary} mt-4 disabled:opacity-50`}>Save RAM Matrix</button>
      </div>

      {/* SSD table */}
      <div className="mb-6 rounded-card border border-black/5 bg-white p-5 shadow-card">
        <h2 className="text-sm font-bold text-ink">SSD Price Table</h2>
        <table className="mt-3 text-sm">
          <thead><tr className="text-[12px] uppercase tracking-wide text-neutral-400"><th className="px-3 py-2 text-left">Capacity</th><th className="px-3 py-2 text-left">Price (₹)</th></tr></thead>
          <tbody>
            {SSD_PRICE_TABLE.map(({ cap }) => (
              <tr key={cap}>
                <td className="px-3 py-2 font-semibold text-ink">{cap}</td>
                <td className="px-3 py-1.5">
                  <input type="number" value={ssd[cap] ?? ""} onChange={(e) => setSsdCell(cap, e.target.value)} className={cellCls} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={() => setConfirm("ssd")} disabled={saving} className={`${btnPrimary} mt-4 disabled:opacity-50`}>Save SSD Table</button>
      </div>

      {blocked && (
        <Modal
          title="Recompute blocked — pricing table has gaps"
          onClose={() => setBlocked(null)}
          footer={
            <>
              <button onClick={() => setBlocked(null)} className={btnGhost}>Cancel</button>
              <button onClick={() => recomputeAll(true)} disabled={recomputing} className={`${btnPrimary} bg-red-600 hover:bg-red-700 disabled:opacity-50`}>
                {recomputing ? "Forcing…" : "Force Recompute anyway"}
              </button>
            </>
          }
        >
          <p className="text-sm font-semibold text-red-700">{blocked.message}</p>
          <p className="mt-1 text-[12px] text-neutral-500">Forcing will set the missing RAM/SSD components to <span className="font-bold">₹0</span> on these products — their listed prices may drop. Prefer adding the capacities to the tables above first.</p>
          <div className="mt-3 max-h-[40vh] divide-y divide-black/5 overflow-y-auto rounded-lg border border-black/5">
            {(blocked.products || []).map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 px-3 py-2 text-[13px]">
                <span className="font-semibold text-ink">{p.name || `#${p.id}`}</span>
                <span className="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-[11px] font-bold text-red-700">
                  {[p.missingRam && "RAM", p.missingSsd && "SSD"].filter(Boolean).join(" & ")} missing
                </span>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {preview && (
        <Modal
          title="Preview price changes"
          onClose={() => setPreview(null)}
          footer={(() => {
            const anyRed = (preview.products || []).some((p) => p.missingTable);
            return (
              <>
                <button onClick={() => setPreview(null)} className={btnGhost}>Cancel</button>
                <button
                  onClick={() => recomputeAll()}
                  disabled={recomputing || anyRed}
                  title={anyRed ? "Fix the missing pricing-table entries first" : undefined}
                  className={`${btnPrimary} disabled:opacity-50`}
                >
                  {recomputing ? "Recomputing…" : anyRed ? "Fix table entries first" : "Looks correct → Recompute All"}
                </button>
              </>
            );
          })()}
        >
          {(() => {
            const rows = (preview.products || []).filter((p) => p.changed || p.missingTable);
            const reds = rows.filter((p) => p.missingTable);
            const s = preview.summary || {};
            return (
              <div>
                <p className="text-sm text-neutral-600">
                  <span className="font-bold text-ink">{s.willChange ?? rows.length}</span> of {s.total ?? rows.length} products will be repriced · {s.unchanged ?? 0} unchanged{s.skipped ? ` · ${s.skipped} without RAM/SSD` : ""}.
                </p>
                {reds.length > 0 && (
                  <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-700">
                    ⚠ {reds.length} product{reds.length === 1 ? "" : "s"} have a RAM/SSD capacity missing from the pricing table — they would price to ₹0. Add those capacities in the tables above, then preview again. Recompute is blocked until this is fixed.
                  </p>
                )}
                {rows.length === 0 ? (
                  <p className="mt-4 rounded-lg bg-neutral-50 px-4 py-6 text-center text-[13px] text-neutral-400">No prices will change — everything is already up to date.</p>
                ) : (
                  <>
                    <p className="mt-2 text-[12px] text-neutral-400">Amber = change over ₹5,000. Red = capacity missing from the pricing table.</p>
                    <div className="mt-3 max-h-[44vh] overflow-y-auto rounded-lg border border-black/5">
                      <table className="w-full text-[13px]">
                        <thead className="sticky top-0 bg-neutral-50 text-left text-[11px] uppercase tracking-wide text-neutral-400">
                          <tr><th className="px-3 py-2">Product</th><th className="px-3 py-2 text-right">Before</th><th className="px-3 py-2 text-right">After</th><th className="px-3 py-2 text-right">Δ</th></tr>
                        </thead>
                        <tbody>
                          {rows.map((p) => {
                            const big = Math.abs(p.delta) > 5000;
                            const rowCls = p.missingTable ? "bg-red-50" : big ? "bg-amber-50" : "";
                            const miss = [p.missingRam && "RAM", p.missingSsd && "SSD"].filter(Boolean).join(" & ");
                            return (
                              <tr key={p.id} className={`border-t border-black/5 ${rowCls}`}>
                                <td className="px-3 py-2">
                                  <span className="font-semibold text-ink">{p.name || `#${p.id}`}</span>
                                  {p.missingTable
                                    ? <span className="ml-1.5 rounded bg-red-200 px-1.5 py-0.5 text-[10px] font-bold text-red-800">missing in table</span>
                                    : big ? <span className="ml-1.5 rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">large change</span> : null}
                                  {p.missingTable && (
                                    <span className="mt-0.5 block text-[11px] font-semibold text-red-700">⚠ {miss} capacity not in pricing table — add it before recomputing</span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-right text-neutral-500">{inr(p.before.listedPrice)}</td>
                                <td className="px-3 py-2 text-right font-semibold text-ink">{inr(p.after.listedPrice)}</td>
                                <td className={`px-3 py-2 text-right font-bold ${p.missingTable ? "text-red-700" : p.delta > 0 ? (big ? "text-amber-700" : "text-ink") : p.delta < 0 ? "text-brand" : "text-neutral-400"}`}>
                                  {p.delta === 0 ? "—" : `${p.delta > 0 ? "+" : "−"}${inr(Math.abs(p.delta))}`}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            );
          })()}
        </Modal>
      )}

      {confirm && (
        <Modal title="Confirm price change" onClose={() => setConfirm(null)}
          footer={<><button onClick={() => setConfirm(null)} className={btnGhost}>Cancel</button><button onClick={doSave} className={btnPrimary}>Confirm &amp; Save</button></>}>
          <p className="text-sm text-neutral-600">This saves the {confirm === "ram" ? "RAM matrix" : "SSD table"} to the database and reprices every affected listing. Confirm?</p>
        </Modal>
      )}
    </div>
  );
}
