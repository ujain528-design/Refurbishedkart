"use client";

import { useState } from "react";
import { PageHeader, Badge, Modal, Field, useToast, inputCls, btnPrimary, btnGhost } from "@/components/admin/ui";
import { ADMIN_ENQUIRIES } from "@/lib/admin-data";

const STATUSES = ["New", "In Progress", "Quoted", "Closed"];

export default function Enquiries() {
  const toast = useToast();
  const [view, setView] = useState(null);

  return (
    <div>
      <PageHeader title="Bulk Enquiries" subtitle={`${ADMIN_ENQUIRIES.length} enquiries`} action={<button onClick={() => toast("Enquiries exported")} className={btnGhost}>Export Excel</button>} />

      <div className="overflow-x-auto rounded-card border border-black/5 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-black/5 text-left text-[12px] uppercase tracking-wide text-neutral-400">
            <th className="px-4 py-3">ID</th><th className="px-3 py-3">Name</th><th className="px-3 py-3">Organisation</th><th className="px-3 py-3">Category</th><th className="px-3 py-3">Qty</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Date</th><th className="px-3 py-3"></th>
          </tr></thead>
          <tbody>
            {ADMIN_ENQUIRIES.map((e, i) => (
              <tr key={e.id} className={i % 2 ? "bg-neutral-50/60" : ""}>
                <td className="px-4 py-3 font-mono text-[13px] text-brand">{e.id}</td>
                <td className="px-3 py-3 font-semibold text-ink">{e.name}</td>
                <td className="px-3 py-3 text-neutral-600">{e.org}</td>
                <td className="px-3 py-3 text-neutral-500">{e.category}</td>
                <td className="px-3 py-3 text-neutral-500">{e.qty}</td>
                <td className="px-3 py-3"><Badge>{e.status}</Badge></td>
                <td className="px-3 py-3 text-[12px] text-neutral-400">{e.date}</td>
                <td className="px-3 py-3"><button onClick={() => setView(e)} className="text-[13px] font-bold text-brand hover:underline">View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {view && (
        <Modal title={`Enquiry ${view.id}`} onClose={() => setView(null)}
          footer={<><button onClick={() => setView(null)} className={btnGhost}>Cancel</button><button onClick={() => { setView(null); toast("Enquiry updated"); }} className={btnPrimary}>Save</button></>}>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-[12px] uppercase text-neutral-400">Name</p><p className="font-semibold text-ink">{view.name}</p></div>
              <div><p className="text-[12px] uppercase text-neutral-400">Organisation</p><p className="font-semibold text-ink">{view.org}</p></div>
              <div><p className="text-[12px] uppercase text-neutral-400">Email</p><p className="text-ink">{view.email}</p></div>
              <div><p className="text-[12px] uppercase text-neutral-400">Phone</p><p className="text-ink">{view.phone}</p></div>
              <div><p className="text-[12px] uppercase text-neutral-400">Category</p><p className="text-ink">{view.category}</p></div>
              <div><p className="text-[12px] uppercase text-neutral-400">Quantity</p><p className="text-ink">{view.qty}</p></div>
              <div><p className="text-[12px] uppercase text-neutral-400">Budget/Unit</p><p className="text-ink">{view.budget}</p></div>
            </div>
            <div><p className="text-[12px] uppercase text-neutral-400">Requirements</p><p className="text-neutral-600">{view.notes}</p></div>
            <Field label="Internal Notes"><textarea rows={3} className={inputCls} placeholder="Add a note…" /></Field>
            <Field label="Status"><select className={inputCls} defaultValue={view.status}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></Field>
          </div>
        </Modal>
      )}
    </div>
  );
}
