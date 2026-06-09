"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader, Badge, Modal, Field, useToast, inputCls, btnPrimary, btnGhost } from "@/components/admin/ui";
import { formatINR } from "@/lib/admin-data";
import { adminGetCoupons, adminCreateCoupon, adminUpdateCoupon, adminToggleCoupon } from "@/lib/api";

const BLANK = { code: "", type: "percent", value: "", minSubtotal: "", expiry: "", usageLimit: "", active: true };
const valueText = (c) => (c.type === "flat" ? formatINR(c.value) : `${c.value}%`);
const expired = (c) => c.expiry && new Date(c.expiry) < new Date();
const statusOf = (c) => (expired(c) ? "expired" : c.active ? "active" : "inactive");

export default function Coupons() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("loading");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setStatus("loading");
    adminGetCoupons().then((c) => { setRows(c); setStatus("ready"); }).catch(() => setStatus("error"));
  }, []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm(BLANK); setEditing({}); };
  const openEdit = (c) => {
    setForm({ code: c.code, type: c.type, value: c.value ?? "", minSubtotal: c.minSubtotal ?? "", expiry: c.expiry ? c.expiry.slice(0, 10) : "", usageLimit: c.usageLimit ?? "", active: c.active !== false });
    setEditing(c);
  };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        code: form.code, type: form.type, value: Number(form.value) || 0,
        minSubtotal: Number(form.minSubtotal) || 0,
        expiry: form.expiry || null, usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        active: form.active,
      };
      if (editing._id) await adminUpdateCoupon(editing._id, payload);
      else await adminCreateCoupon(payload);
      toast("Coupon saved");
      setEditing(null);
      load();
    } catch (e) { toast(e.message || "Save failed", "error"); }
    finally { setSaving(false); }
  };

  const toggle = async (c) => {
    try { await adminToggleCoupon(c._id, !c.active); setRows((rs) => rs.map((x) => (x._id === c._id ? { ...x, active: !c.active } : x))); }
    catch (e) { toast(e.message, "error"); }
  };

  return (
    <div>
      <PageHeader title="Coupons" subtitle="Discount codes & redemption limits." action={<button onClick={openNew} className={btnPrimary}>+ Add Coupon</button>} />

      {status === "loading" ? (
        <p className="py-16 text-center text-sm text-neutral-400">Loading coupons…</p>
      ) : status === "error" ? (
        <div className="rounded-card border border-black/5 bg-white p-10 text-center shadow-card">
          <p className="text-sm font-semibold text-neutral-600">Couldn't load coupons.</p>
          <button onClick={load} className="mt-4 rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-dark">Retry</button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-card border border-black/5 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-black/5 text-left text-[12px] uppercase tracking-wide text-neutral-400">
              <th className="px-4 py-3">Code</th><th className="px-3 py-3">Type</th><th className="px-3 py-3">Value</th><th className="px-3 py-3">Min order</th><th className="px-3 py-3">Used</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Actions</th>
            </tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-neutral-400">No coupons yet.</td></tr>}
              {rows.map((c, i) => (
                <tr key={c._id} className={i % 2 ? "bg-neutral-50/60" : ""}>
                  <td className="px-4 py-3 font-mono font-bold text-ink">{c.code}</td>
                  <td className="px-3 py-3 capitalize text-neutral-500">{c.type}</td>
                  <td className="px-3 py-3 font-semibold text-ink">{valueText(c)}</td>
                  <td className="px-3 py-3 text-neutral-500">{c.minSubtotal ? formatINR(c.minSubtotal) : "—"}</td>
                  <td className="px-3 py-3 text-neutral-500">{c.used || 0}/{c.usageLimit ?? "∞"}</td>
                  <td className="px-3 py-3"><Badge>{statusOf(c)}</Badge></td>
                  <td className="px-3 py-3"><div className="flex gap-2">
                    <button onClick={() => openEdit(c)} className="text-[13px] font-bold text-brand hover:underline">Edit</button>
                    <button onClick={() => toggle(c)} className="text-[13px] font-bold text-red-600 hover:underline">{c.active ? "Deactivate" : "Activate"}</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal title={editing._id ? `Edit ${editing.code}` : "Add Coupon"} onClose={() => setEditing(null)}
          footer={<><button onClick={() => setEditing(null)} className={btnGhost}>Cancel</button><button onClick={save} disabled={saving} className={btnPrimary}>{saving ? "Saving…" : "Save"}</button></>}>
          <div className="mt-1 grid grid-cols-2 gap-3">
            <Field label="Code"><input className={`${inputCls} uppercase`} value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} /></Field>
            <Field label="Type"><select className={inputCls} value={form.type} onChange={(e) => set("type", e.target.value)}><option value="percent">percent</option><option value="flat">flat</option></select></Field>
            <Field label={form.type === "flat" ? "Discount ₹" : "Discount %"}><input type="number" className={inputCls} value={form.value} onChange={(e) => set("value", e.target.value)} /></Field>
            <Field label="Min Order Value ₹"><input type="number" className={inputCls} value={form.minSubtotal} onChange={(e) => set("minSubtotal", e.target.value)} /></Field>
            <Field label="Expiry Date"><input type="date" className={inputCls} value={form.expiry} onChange={(e) => set("expiry", e.target.value)} /></Field>
            <Field label="Redemption Limit" hint="blank = unlimited"><input type="number" className={inputCls} value={form.usageLimit} onChange={(e) => set("usageLimit", e.target.value)} /></Field>
            <label className="col-span-2 flex items-center gap-2 pt-1 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} className="accent-brand" /> Active</label>
          </div>
        </Modal>
      )}
    </div>
  );
}
