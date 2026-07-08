"use client";

import { useEffect, useState } from "react";
import { inputCls } from "@/components/admin/ui";
import { adminGetCustomFieldValues, adminAddCustomFieldValue } from "@/lib/api";

const ADD = "__add_custom__";
const lc = (s) => String(s ?? "").trim().toLowerCase();

/* A <select> that also lets an admin add a custom value which is saved to the DB and
   offered on future products. Custom values are scoped to `field` + `family` (e.g.
   processor model under family "Intel Xeon"), shown grouped under "Custom". */
export default function SelectWithCustom({ field, family = "", value = "", onChange, options = [], label, category = "" }) {
  const [custom, setCustom] = useState([]); // string[] of DB custom values for this field+family
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load custom values whenever field/family changes.
  useEffect(() => {
    let alive = true;
    setLoading(true);
    adminGetCustomFieldValues(family ? { field, family } : { field })
      .then((rows) => { if (alive) setCustom(rows.map((r) => r.value)); })
      .catch(() => { if (alive) setCustom([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [field, family]);

  // Merge base + custom (dedupe case-insensitively; base wins).
  const baseSet = new Set(options.map(lc));
  const customOnly = custom.filter((c) => !baseSet.has(lc(c)));

  // Canonical existing casing for a typed value (so we select the stored spelling).
  const existingMatch = (v) => options.find((o) => lc(o) === lc(v)) || customOnly.find((o) => lc(o) === lc(v)) || null;

  const handleSelect = (v) => {
    if (v === ADD) { setAdding(true); setDraft(""); setError(""); return; }
    onChange(v);
  };

  const save = async () => {
    const v = draft.trim();
    if (!v) { setError("Enter a value"); return; }
    // Client-side duplicate guard (server also enforces this). If it already exists,
    // just select it — no new record.
    const match = existingMatch(v);
    if (match) { onChange(match); setAdding(false); setDraft(""); return; }
    setSaving(true); setError("");
    try {
      const { value: saved } = await adminAddCustomFieldValue({ field, family, value: v, category: category ? [lc(category)] : [] });
      setCustom((c) => (c.some((x) => lc(x) === lc(saved.value)) ? c : [...c, saved.value]));
      onChange(saved.value);
      setAdding(false); setDraft("");
    } catch (e) {
      setError(e.message || "Couldn't save custom value");
    } finally {
      setSaving(false);
    }
  };

  return (
    <label className="block">
      {label && (
        <span className="mb-1 block text-[12px] font-semibold text-neutral-600">
          {label}
          {loading && <span className="ml-2 text-[11px] font-normal text-neutral-400">loading…</span>}
        </span>
      )}
      {!adding ? (
        <select value={value ?? ""} onChange={(e) => handleSelect(e.target.value)} className={inputCls}>
          <option value="">— Select —</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
          {customOnly.length > 0 && (
            <optgroup label="─── Custom ───">
              {customOnly.map((o) => <option key={o} value={o}>{o}</option>)}
            </optgroup>
          )}
          <option value={ADD}>+ Add custom value…</option>
        </select>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); save(); } }}
            placeholder={family ? `New ${family} value…` : "Type a custom value"}
            className={inputCls}
          />
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={save} disabled={saving} className="rounded-lg bg-brand px-4 py-2 text-[13px] font-bold text-white hover:bg-brand-dark disabled:opacity-50">{saving ? "Saving…" : "Add"}</button>
            <button type="button" onClick={() => { setAdding(false); setError(""); setDraft(""); }} className="rounded-lg border border-black/10 px-4 py-2 text-[13px] font-bold text-neutral-600 hover:border-neutral-400">Cancel</button>
          </div>
        </div>
      )}
      {error && <span className="mt-1 block text-[11px] font-semibold text-red-600">{error}</span>}
    </label>
  );
}
