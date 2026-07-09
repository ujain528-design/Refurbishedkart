"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader, Badge, Modal, Field, useToast, inputCls, btnPrimary, btnGhost } from "@/components/admin/ui";
import { formatINR } from "@/lib/admin-data";
import { adminGetCoupons, adminCreateCoupon, adminUpdateCoupon, adminToggleCoupon } from "@/lib/api";

const CATEGORIES = ["Laptops", "Desktops", "Monitors", "Servers", "Workstations"];
const BRANDS = ["Dell", "HP", "Lenovo", "Apple", "Asus", "Acer", "Samsung", "Other"];

const SEGMENTS = [
  { v: "all", label: "Everyone" },
  { v: "first_order", label: "First order only" },
  { v: "nth_order", label: "Nth order" },
  { v: "returning", label: "Returning customers" },
  { v: "new_signup", label: "Newly signed up" },
  { v: "high_value", label: "High-value customers" },
  { v: "inactive", label: "Inactive customers" },
  { v: "whatsapp", label: "WhatsApp subscribers" },
  { v: "specific", label: "Specific customers" },
];
const SEGMENT_LABEL = Object.fromEntries(SEGMENTS.map((s) => [s.v, s.label]));

const BLANK = {
  code: "", description: "", active: true,
  type: "percent", value: "", maxDiscount: "",
  startDate: "", expiryDate: "", minSubtotal: "",
  usageLimit: "", perCustomerLimit: "1",
  customerSegment: "all", nthOrder: "", newSignupDays: "", highValueAmount: "", inactiveDays: "",
  allowedEmails: "", allowedPhones: "",
  applicableCategories: [], applicableBrands: [],
  autoApply: false,
};

const valueText = (c) => {
  if (c.type === "flat") return formatINR(c.value);
  if (c.type === "free_shipping") return "Free shipping";
  return `${c.value}%${c.maxDiscount ? ` (max ${formatINR(c.maxDiscount)})` : ""}`;
};
const expiryOf = (c) => c.expiryDate || c.expiry;
const expired = (c) => expiryOf(c) && new Date(expiryOf(c)) < new Date();
const statusOf = (c) => (expired(c) ? "expired" : c.active ? "active" : "inactive");
const dateOnly = (d) => (d ? String(d).slice(0, 10) : "");
const listText = (arr) => (Array.isArray(arr) ? arr.join("\n") : arr || "");

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
    setForm({
      code: c.code || "", description: c.description || "", active: c.active !== false,
      type: c.type || "percent", value: c.value ?? "", maxDiscount: c.maxDiscount ?? "",
      startDate: dateOnly(c.startDate), expiryDate: dateOnly(expiryOf(c)), minSubtotal: c.minSubtotal ?? "",
      usageLimit: c.usageLimit ?? "", perCustomerLimit: c.perCustomerLimit ?? 1,
      customerSegment: c.customerSegment || "all",
      nthOrder: c.nthOrder || "", newSignupDays: c.newSignupDays || "", highValueAmount: c.highValueAmount || "", inactiveDays: c.inactiveDays || "",
      allowedEmails: listText(c.allowedEmails), allowedPhones: listText(c.allowedPhones),
      applicableCategories: c.applicableCategories || [], applicableBrands: c.applicableBrands || [],
      autoApply: c.autoApply === true,
    });
    setEditing(c);
  };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleIn = (k, val) => setForm((f) => {
    const cur = f[k] || [];
    return { ...f, [k]: cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val] };
  });

  const save = async () => {
    if (!form.code.trim()) { toast("Coupon code is required", "error"); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        value: Number(form.value) || 0,
        maxDiscount: Number(form.maxDiscount) || 0,
        minSubtotal: Number(form.minSubtotal) || 0,
        usageLimit: form.usageLimit === "" ? null : Number(form.usageLimit),
        perCustomerLimit: form.perCustomerLimit === "" ? 1 : Number(form.perCustomerLimit),
        nthOrder: Number(form.nthOrder) || 0,
        newSignupDays: Number(form.newSignupDays) || 0,
        highValueAmount: Number(form.highValueAmount) || 0,
        inactiveDays: Number(form.inactiveDays) || 0,
        startDate: form.startDate || null,
        expiryDate: form.expiryDate || null,
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

  const seg = form.customerSegment;

  return (
    <div>
      <PageHeader title="Coupons" subtitle="Discount codes, targeting & redemption limits." action={<button onClick={openNew} className={btnPrimary}>+ Add Coupon</button>} />

      {status === "loading" ? (
        <p className="py-16 text-center text-sm text-neutral-400">Loading coupons…</p>
      ) : status === "error" ? (
        <div className="rounded-card border border-black/5 bg-white p-10 text-center shadow-card">
          <p className="text-sm font-semibold text-neutral-600">Couldn&apos;t load coupons.</p>
          <button onClick={load} className="mt-4 rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-dark">Retry</button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-card border border-black/5 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-black/5 text-left text-[12px] uppercase tracking-wide text-neutral-400">
              <th className="px-4 py-3">Code</th><th className="px-3 py-3">Value</th><th className="px-3 py-3">Segment</th><th className="px-3 py-3">Auto</th><th className="px-3 py-3">Uses</th><th className="px-3 py-3">Valid until</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Actions</th>
            </tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-neutral-400">No coupons yet.</td></tr>}
              {rows.map((c, i) => (
                <tr key={c._id} className={i % 2 ? "bg-neutral-50/60" : ""}>
                  <td className="px-4 py-3 font-mono font-bold text-ink">{c.code}</td>
                  <td className="px-3 py-3 font-semibold text-ink">{valueText(c)}</td>
                  <td className="px-3 py-3 text-neutral-500">{SEGMENT_LABEL[c.customerSegment] || "Everyone"}</td>
                  <td className="px-3 py-3">{c.autoApply ? <span className="inline-block rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-bold text-green-700">Auto</span> : <span className="text-neutral-300">—</span>}</td>
                  <td className="px-3 py-3 text-neutral-500">{c.used || 0}/{c.usageLimit ? c.usageLimit : "∞"}</td>
                  <td className="px-3 py-3 text-neutral-500">{expiryOf(c) ? new Date(expiryOf(c)).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
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
          <div className="space-y-5">
            {/* BASIC */}
            <section>
              <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-neutral-400">Basic</h4>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Code"><input className={`${inputCls} uppercase`} value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} /></Field>
                <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} className="accent-brand" /> Active</label>
                <div className="col-span-2"><Field label="Description" hint="internal — not shown to customers"><input className={inputCls} value={form.description} onChange={(e) => set("description", e.target.value)} /></Field></div>
              </div>
            </section>

            {/* DISCOUNT */}
            <section>
              <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-neutral-400">Discount</h4>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Type"><select className={inputCls} value={form.type} onChange={(e) => set("type", e.target.value)}>
                  <option value="percent">Percentage %</option>
                  <option value="flat">Flat ₹</option>
                  <option value="free_shipping">Free shipping</option>
                </select></Field>
                {form.type !== "free_shipping" && (
                  <Field label={form.type === "flat" ? "Discount ₹" : "Discount %"}><input type="number" className={inputCls} value={form.value} onChange={(e) => set("value", e.target.value)} /></Field>
                )}
                {form.type === "percent" && (
                  <Field label="Max discount ₹" hint="cap on the % (0 = no cap)"><input type="number" className={inputCls} value={form.maxDiscount} onChange={(e) => set("maxDiscount", e.target.value)} /></Field>
                )}
              </div>
            </section>

            {/* VALIDITY */}
            <section>
              <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-neutral-400">Validity</h4>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start date" hint="blank = now"><input type="date" className={inputCls} value={form.startDate} onChange={(e) => set("startDate", e.target.value)} /></Field>
                <Field label="Expiry date" hint="blank = never"><input type="date" className={inputCls} value={form.expiryDate} onChange={(e) => set("expiryDate", e.target.value)} /></Field>
                <Field label="Min order value ₹"><input type="number" className={inputCls} value={form.minSubtotal} onChange={(e) => set("minSubtotal", e.target.value)} /></Field>
              </div>
            </section>

            {/* USAGE LIMITS */}
            <section>
              <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-neutral-400">Usage limits</h4>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Total redemptions" hint="blank = unlimited"><input type="number" className={inputCls} value={form.usageLimit} onChange={(e) => set("usageLimit", e.target.value)} /></Field>
                <Field label="Per customer" hint="0 = unlimited"><input type="number" className={inputCls} value={form.perCustomerLimit} onChange={(e) => set("perCustomerLimit", e.target.value)} /></Field>
              </div>
            </section>

            {/* CUSTOMER SEGMENT */}
            <section>
              <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-neutral-400">Customer segment</h4>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Who can use this"><select className={inputCls} value={form.customerSegment} onChange={(e) => set("customerSegment", e.target.value)}>
                  {SEGMENTS.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
                </select></Field>
                {seg === "nth_order" && <Field label="Apply on order number"><input type="number" className={inputCls} value={form.nthOrder} onChange={(e) => set("nthOrder", e.target.value)} /></Field>}
                {seg === "new_signup" && <Field label="Registered within last (days)"><input type="number" className={inputCls} value={form.newSignupDays} onChange={(e) => set("newSignupDays", e.target.value)} /></Field>}
                {seg === "high_value" && <Field label="Minimum total spend ₹"><input type="number" className={inputCls} value={form.highValueAmount} onChange={(e) => set("highValueAmount", e.target.value)} /></Field>}
                {seg === "inactive" && <Field label="No order in last (days)"><input type="number" className={inputCls} value={form.inactiveDays} onChange={(e) => set("inactiveDays", e.target.value)} /></Field>}
              </div>
              {seg === "specific" && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Field label="Allowed emails" hint="one per line"><textarea rows={4} className={inputCls} value={form.allowedEmails} onChange={(e) => set("allowedEmails", e.target.value)} /></Field>
                  <Field label="Allowed phones" hint="one per line"><textarea rows={4} className={inputCls} value={form.allowedPhones} onChange={(e) => set("allowedPhones", e.target.value)} /></Field>
                </div>
              )}
            </section>

            {/* RESTRICTIONS */}
            <section>
              <h4 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-neutral-400">Restrictions <span className="font-normal normal-case text-neutral-300">(none checked = applies to all)</span></h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="mb-1.5 text-[12px] font-semibold text-neutral-500">Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                      <label key={cat} className={`cursor-pointer rounded-full border px-3 py-1 text-[13px] ${form.applicableCategories.includes(cat) ? "border-brand bg-brand/10 text-brand" : "border-black/10 text-neutral-500"}`}>
                        <input type="checkbox" className="sr-only" checked={form.applicableCategories.includes(cat)} onChange={() => toggleIn("applicableCategories", cat)} />{cat}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-[12px] font-semibold text-neutral-500">Brands</p>
                  <div className="flex flex-wrap gap-2">
                    {BRANDS.map((b) => (
                      <label key={b} className={`cursor-pointer rounded-full border px-3 py-1 text-[13px] ${form.applicableBrands.includes(b) ? "border-brand bg-brand/10 text-brand" : "border-black/10 text-neutral-500"}`}>
                        <input type="checkbox" className="sr-only" checked={form.applicableBrands.includes(b)} onChange={() => toggleIn("applicableBrands", b)} />{b}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* AUTO-APPLY */}
            <section>
              <label className="flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2.5 text-sm">
                <input type="checkbox" checked={form.autoApply} onChange={(e) => set("autoApply", e.target.checked)} className="accent-brand" />
                <span><span className="font-semibold text-ink">Auto-apply</span> — applied automatically at cart if the customer qualifies (best coupon wins).</span>
              </label>
            </section>
          </div>
        </Modal>
      )}
    </div>
  );
}
