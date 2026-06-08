"use client";

import { useState } from "react";
import { PageHeader, Modal, useToast, btnPrimary, btnGhost } from "@/components/admin/ui";
import { RAM_PRICE_MATRIX, SSD_PRICE_TABLE } from "@/lib/admin-data";

export default function PricingControl() {
  const toast = useToast();
  const [confirm, setConfirm] = useState(null);
  const cellCls = "w-20 rounded border border-black/10 px-2 py-1 text-center text-[13px] focus:border-brand focus:outline-none";

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
                    <td key={c} className="px-2 py-1.5"><input defaultValue={RAM_PRICE_MATRIX.prices[t][c]} className={cellCls} /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button onClick={() => setConfirm("RAM prices")} className={`${btnPrimary} mt-4`}>Save RAM Matrix</button>
      </div>

      {/* SSD table */}
      <div className="mb-6 rounded-card border border-black/5 bg-white p-5 shadow-card">
        <h2 className="text-sm font-bold text-ink">SSD Price Table</h2>
        <table className="mt-3 text-sm">
          <thead><tr className="text-[12px] uppercase tracking-wide text-neutral-400"><th className="px-3 py-2 text-left">Capacity</th><th className="px-3 py-2 text-left">Price (₹)</th></tr></thead>
          <tbody>
            {SSD_PRICE_TABLE.map((s) => (
              <tr key={s.cap}><td className="px-3 py-2 font-semibold text-ink">{s.cap}</td><td className="px-3 py-1.5"><input defaultValue={s.price} className={cellCls} /></td></tr>
            ))}
          </tbody>
        </table>
        <button onClick={() => setConfirm("SSD prices")} className={`${btnPrimary} mt-4`}>Save SSD Table</button>
      </div>

      {/* settings */}
      <div className="max-w-sm rounded-card border border-black/5 bg-white p-5 shadow-card">
        <h2 className="text-sm font-bold text-ink">Settings</h2>
        <label className="mt-3 block text-[12px] font-semibold text-neutral-600">Low Stock Threshold</label>
        <input type="number" defaultValue={5} className="mt-1 w-24 rounded border border-black/10 px-2 py-1.5 text-sm" />
      </div>

      {confirm && (
        <Modal title="Confirm price change" onClose={() => setConfirm(null)}
          footer={<><button onClick={() => setConfirm(null)} className={btnGhost}>Cancel</button><button onClick={() => { setConfirm(null); toast(`${confirm} updated across 26 listings`); }} className={btnPrimary}>Confirm</button></>}>
          <p className="text-sm text-neutral-600">This will update {confirm} across all <span className="font-bold text-ink">26 listings</span>. Confirm?</p>
        </Modal>
      )}
    </div>
  );
}
