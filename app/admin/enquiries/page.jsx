"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader, Badge, Modal, Field, useToast, inputCls, btnPrimary, btnGhost } from "@/components/admin/ui";
import { adminGetEnquiries, adminUpdateEnquiry } from "@/lib/api";

const STATUSES = ["New", "In Progress", "Quoted", "Closed"];
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");

export default function Enquiries() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("loading");
  const [view, setView] = useState(null);
  const [form, setForm] = useState({ status: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setStatus("loading");
    adminGetEnquiries().then((r) => { setRows(r); setStatus("ready"); }).catch(() => setStatus("error"));
  }, []);
  useEffect(() => { load(); }, [load]);

  const open = (e) => { setView(e); setForm({ status: e.status || "New", notes: e.message || "" }); };
  const save = async () => {
    setSaving(true);
    try {
      const updated = await adminUpdateEnquiry(view.id, { status: form.status, notes: form.notes });
      setRows((rs) => rs.map((r) => (r.id === view.id ? { ...r, status: updated.status, message: updated.message } : r)));
      toast("Enquiry updated");
      setView(null);
    } catch (e) { toast(e.message || "Update failed", "error"); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader title="Bulk Enquiries" subtitle={`${rows.length} enquiries`} />

      {status === "loading" ? (
        <p className="py-16 text-center text-sm text-neutral-400">Loading enquiries…</p>
      ) : status === "error" ? (
        <div className="rounded-card border border-black/5 bg-white p-10 text-center shadow-card">
          <p className="text-sm font-semibold text-neutral-600">Couldn't load enquiries.</p>
          <button onClick={load} className="mt-4 rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-dark">Retry</button>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-card border border-dashed border-black/10 bg-neutral-50 p-12 text-center text-sm text-neutral-500">No bulk enquiries yet.</div>
      ) : (
        <div className="overflow-x-auto rounded-card border border-black/5 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-black/5 text-left text-[12px] uppercase tracking-wide text-neutral-400">
              <th className="px-4 py-3">Name</th><th className="px-3 py-3">Organisation</th><th className="px-3 py-3">Category</th><th className="px-3 py-3">Qty</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Date</th><th className="px-3 py-3"></th>
            </tr></thead>
            <tbody>
              {rows.map((e, i) => (
                <tr key={e.id} className={i % 2 ? "bg-neutral-50/60" : ""}>
                  <td className="px-4 py-3 font-semibold text-ink">{e.name}</td>
                  <td className="px-3 py-3 text-neutral-600">{e.company}</td>
                  <td className="px-3 py-3 text-neutral-500">{e.category}</td>
                  <td className="px-3 py-3 text-neutral-500">{e.quantity}</td>
                  <td className="px-3 py-3"><Badge>{e.status}</Badge></td>
                  <td className="px-3 py-3 text-[12px] text-neutral-400">{fmtDate(e.createdAt)}</td>
                  <td className="px-3 py-3"><button onClick={() => open(e)} className="text-[13px] font-bold text-brand hover:underline">View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view && (
        <Modal title={`Enquiry · ${view.name}`} onClose={() => setView(null)}
          footer={<><button onClick={() => setView(null)} className={btnGhost}>Cancel</button><button onClick={save} disabled={saving} className={btnPrimary}>{saving ? "Saving…" : "Save"}</button></>}>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-[12px] uppercase text-neutral-400">Organisation</p><p className="font-semibold text-ink">{view.company}</p></div>
              <div><p className="text-[12px] uppercase text-neutral-400">Email</p><p className="text-ink">{view.email}</p></div>
              <div><p className="text-[12px] uppercase text-neutral-400">Phone</p><p className="text-ink">{view.phone}</p></div>
              <div><p className="text-[12px] uppercase text-neutral-400">Category</p><p className="text-ink">{view.category}</p></div>
              <div><p className="text-[12px] uppercase text-neutral-400">Quantity</p><p className="text-ink">{view.quantity}</p></div>
            </div>
            <Field label="Requirements / Notes"><textarea rows={3} className={inputCls} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></Field>
            <Field label="Status"><select className={inputCls} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></Field>
          </div>
        </Modal>
      )}
    </div>
  );
}
