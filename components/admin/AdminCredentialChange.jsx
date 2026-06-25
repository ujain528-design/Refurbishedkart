"use client";

import { useState } from "react";
import { inputCls, btnPrimary } from "@/components/admin/ui";

const ID_RE = /^[A-Za-z0-9]{4,20}$/;

async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch {}
  return { ok: res.ok, data: data || {} };
}

/* OTP-gated admin credential change. step: idle → otp → form. */
export default function AdminCredentialChange() {
  const [step, setStep] = useState("idle");
  const [otp, setOtp] = useState("");
  const [form, setForm] = useState({ newAdminId: "", newPassword: "", confirmPassword: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setError(""); };

  const sendOtp = async () => {
    setBusy(true); setError(""); setInfo("");
    const { ok, data } = await postJson("/api/admin/auth/send-otp");
    setBusy(false);
    if (!ok) return setError(data.error || "Couldn't send OTP.");
    setStep("otp");
    setInfo(`A 6-digit OTP has been emailed to ${data.sentTo || "the admin address"}. It expires in 10 minutes.`);
  };

  const verifyOtp = async () => {
    if (!/^\d{6}$/.test(otp)) return setError("Enter the 6-digit OTP.");
    setBusy(true); setError("");
    const { ok, data } = await postJson("/api/admin/auth/verify-otp", { otp });
    setBusy(false);
    if (!ok) return setError(data.error || "Invalid OTP.");
    setStep("form");
    setInfo("OTP verified. Set your new credentials.");
  };

  const submit = async () => {
    if (!ID_RE.test(form.newAdminId)) return setError("Admin ID must be 4–20 letters/numbers, no spaces.");
    if (form.newPassword.length < 8) return setError("Password must be at least 8 characters.");
    if (form.newPassword !== form.confirmPassword) return setError("Passwords do not match.");
    setBusy(true); setError("");
    const { ok, data } = await postJson("/api/admin/auth/change-credentials", { otp, ...form });
    setBusy(false);
    if (!ok) return setError(data.error || "Couldn't change credentials.");
    setInfo("Credentials updated. Redirecting to login…");
    setTimeout(() => window.location.assign("/admin/login"), 1200);
  };

  return (
    <div className="max-w-md rounded-card border border-black/5 bg-white p-5 shadow-card">
      <h3 className="text-sm font-bold text-ink">Change Admin Credentials</h3>
      <p className="mt-1 text-[13px] text-neutral-500">
        Changing your Admin ID or password requires an OTP sent to the registered admin email. Your current session will end after the change.
      </p>

      {info && <p className="mt-3 rounded-lg bg-brand-soft px-3 py-2 text-[13px] font-semibold text-brand">{info}</p>}
      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[13px] font-semibold text-red-600">{error}</p>}

      {step === "idle" && (
        <button onClick={sendOtp} disabled={busy} className={`${btnPrimary} mt-4`}>
          {busy ? "Sending…" : "Change ID / Password"}
        </button>
      )}

      {step === "otp" && (
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-neutral-600">Enter OTP</span>
            <input className={inputCls} inputMode="numeric" maxLength={6} value={otp}
              onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
              placeholder="6-digit code" />
          </label>
          <div className="flex gap-2">
            <button onClick={verifyOtp} disabled={busy} className={btnPrimary}>{busy ? "Verifying…" : "Verify OTP"}</button>
            <button onClick={sendOtp} disabled={busy} className="rounded-full border border-black/10 px-4 py-2.5 text-sm font-semibold text-neutral-600 hover:bg-neutral-100 disabled:opacity-50">Resend</button>
          </div>
        </div>
      )}

      {step === "form" && (
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-neutral-600">New Admin ID</span>
            <input className={inputCls} value={form.newAdminId} autoComplete="username"
              onChange={(e) => set("newAdminId", e.target.value.replace(/\s/g, ""))} placeholder="4–20 letters/numbers" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-neutral-600">New Password</span>
            <input type="password" className={inputCls} value={form.newPassword} autoComplete="new-password"
              onChange={(e) => set("newPassword", e.target.value)} placeholder="Min 8 characters" />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-neutral-600">Confirm New Password</span>
            <input type="password" className={inputCls} value={form.confirmPassword} autoComplete="new-password"
              onChange={(e) => set("confirmPassword", e.target.value)} placeholder="Re-enter password" />
          </label>
          <button onClick={submit} disabled={busy} className={btnPrimary}>{busy ? "Updating…" : "Update Credentials"}</button>
        </div>
      )}
    </div>
  );
}
