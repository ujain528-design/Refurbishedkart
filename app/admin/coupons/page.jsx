"use client";

import { useState } from "react";
import { PageHeader, Badge, Toggle, Modal, Tabs, Field, useToast, inputCls, btnPrimary, btnGhost } from "@/components/admin/ui";
import { ADMIN_COUPONS, formatINR } from "@/lib/admin-data";
import { CATEGORY_SLUGS } from "@/lib/data";

export default function Coupons() {
  const toast = useToast();
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState(null);
  const [tab, setTab] = useState("Details");

  const rows = ADMIN_COUPONS.filter((c) => filter === "all" || c.status === filter);
  const valueText = (c) => (c.type === "percentage" ? `${c.value}%` : formatINR(c.value));

  return (
    <div>
      <PageHeader title="Coupons" subtitle="Discount codes & redemption limits." action={<button onClick={() => { setEditing({}); setTab("Details"); }} className={btnPrimary}>+ Add Coupon</button>} />

      <div className="mb-4 flex gap-2">
        {["all", "active", "expired", "exhausted"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-1.5 text-[13px] font-semibold capitalize ${filter === f ? "bg-brand text-white" : "border border-black/10 text-ink"}`}>{f}</button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-card border border-black/5 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-black/5 text-left text-[12px] uppercase tracking-wide text-neutral-400">
            <th className="px-4 py-3">Code</th><th className="px-3 py-3">Type</th><th className="px-3 py-3">Value</th><th className="px-3 py-3">Usage</th><th className="px-3 py-3">Expiry</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Actions</th>
          </tr></thead>
          <tbody>
            {rows.map((c, i) => (
              <tr key={c.code} className={i % 2 ? "bg-neutral-50/60" : ""}>
                <td className="px-4 py-3 font-mono font-bold text-ink">{c.code}</td>
                <td className="px-3 py-3 capitalize text-neutral-500">{c.type}</td>
                <td className="px-3 py-3 font-semibold text-ink">{valueText(c)}</td>
                <td className="px-3 py-3 text-neutral-500">{c.used}/{c.limit ?? "∞"}</td>
                <td className="px-3 py-3 text-[12px] text-neutral-400">{c.expiry}</td>
                <td className="px-3 py-3"><Badge>{c.status}</Badge></td>
                <td className="px-3 py-3"><div className="flex gap-2"><button onClick={() => { setEditing(c); setTab("Details"); }} className="text-[13px] font-bold text-brand hover:underline">Edit</button><button onClick={() => toast(`${c.code} deactivated`, "error")} className="text-[13px] font-bold text-red-600 hover:underline">Deactivate</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal title={editing.code ? `Edit ${editing.code}` : "Add Coupon"} onClose={() => setEditing(null)}
          footer={<><button onClick={() => setEditing(null)} className={btnGhost}>Cancel</button><button onClick={() => { setEditing(null); toast("Coupon saved"); }} className={btnPrimary}>Save</button></>}>
          <Tabs tabs={["Details", "Usage History"]} active={tab} onChange={setTab} />
          {tab === "Details" ? (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Field label="Code"><input className={`${inputCls} uppercase`} defaultValue={editing.code} /></Field>
              <Field label="Type"><select className={inputCls}><option>percentage</option><option>flat</option></select></Field>
              <Field label="Discount Value"><input type="number" className={inputCls} defaultValue={editing.value} /></Field>
              <Field label="Min Order Value"><input type="number" className={inputCls} defaultValue={editing.min} /></Field>
              <Field label="Expiry Date"><input type="date" className={inputCls} /></Field>
              <Field label="Total Redemption Limit" hint="blank = unlimited"><input type="number" className={inputCls} defaultValue={editing.limit ?? ""} /></Field>
              <Field label="Per-User Limit"><input type="number" className={inputCls} defaultValue={1} /></Field>
              <Field label="Applicable Categories"><select className={inputCls}><option>All</option>{Object.values(CATEGORY_SLUGS).map((c) => <option key={c}>{c}</option>)}</select></Field>
              <div className="col-span-2 flex flex-wrap gap-5 pt-1">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked className="accent-brand" /> Bind to phone</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-brand" /> Stack with flash sale</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked className="accent-brand" /> Active</label>
              </div>
            </div>
          ) : (
            <table className="mt-4 w-full text-sm">
              <thead><tr className="text-left text-[12px] uppercase text-neutral-400"><th className="py-2">User / Phone</th><th className="py-2">Used</th><th className="py-2">Order</th></tr></thead>
              <tbody>
                {[["+91 98765 43210", "04 Jun", "₹27,499"], ["+91 90000 11111", "02 Jun", "₹14,499"], ["priya@email.com", "29 May", "₹47,999"]].map((r, i) => (
                  <tr key={i} className="border-t border-black/5"><td className="py-2">{r[0]}</td><td className="py-2 text-neutral-500">{r[1]}</td><td className="py-2 font-semibold">{r[2]}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </Modal>
      )}
    </div>
  );
}
