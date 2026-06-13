"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader, Modal, useToast, btnPrimary, btnGhost } from "@/components/admin/ui";
import { RAM_PRICE_MATRIX, SSD_PRICE_TABLE } from "@/lib/admin-data";
import { adminGetPricingConfig, adminUpdateRamPricing, adminUpdateSsdPricing } from "@/lib/api";

const cellCls = "w-20 rounded border border-black/10 px-2 py-1 text-center text-[13px] focus:border-brand focus:outline-none";

export default function PricingControl() {
  const toast = useToast();
  const [ram, setRam] = useState({});   // { [type]: { [cap]: value } }
  const [ssd, setSsd] = useState({});   // { [cap]: value }
  const [status, setStatus] = useState("loading");
  const [confirm, setConfirm] = useState(null); // "ram" | "ssd"
  const [saving, setSaving] = useState(false);

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

      {confirm && (
        <Modal title="Confirm price change" onClose={() => setConfirm(null)}
          footer={<><button onClick={() => setConfirm(null)} className={btnGhost}>Cancel</button><button onClick={doSave} className={btnPrimary}>Confirm &amp; Save</button></>}>
          <p className="text-sm text-neutral-600">This saves the {confirm === "ram" ? "RAM matrix" : "SSD table"} to the database and reprices every affected listing. Confirm?</p>
        </Modal>
      )}
    </div>
  );
}
