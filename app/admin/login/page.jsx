"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const ID_RE = /^[A-Za-z0-9]{4,20}$/;

const inputCls =
  "w-full rounded-lg border border-black/10 px-3.5 py-2.5 text-sm text-ink placeholder:text-neutral-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15";

async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data = null;
  try { data = await res.json(); } catch {}
  return { ok: res.ok, status: res.status, data: data || {} };
}

function AdminLoginContent() {
  const params = useSearchParams();
  const next = params.get("next");
  const target = next && next.startsWith("/admin") ? next : "/admin";

  const [mode, setMode] = useState("loading"); // loading | setup | login
  const [form, setForm] = useState({ adminId: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [notice, setNotice] = useState("");

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setError(""); };

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/auth/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((s) => {
        if (!alive) return;
        if (s.authed) { window.location.assign(target); return; }
        setMode(s.setupRequired ? "setup" : "login");
      })
      .catch(() => alive && setMode("login"));
    return () => { alive = false; };
  }, [target]);

  const submitSetup = async (e) => {
    e.preventDefault();
    if (!ID_RE.test(form.adminId)) return setError("Admin ID must be 4–20 letters/numbers, no spaces.");
    if (form.password.length < 8) return setError("Password must be at least 8 characters.");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match.");
    setBusy(true);
    const { ok, data } = await postJson("/api/admin/auth/setup", form);
    setBusy(false);
    if (!ok) return setError(data.error || "Setup failed.");
    setNotice("Admin account created. Please log in.");
    setForm({ adminId: "", password: "", confirmPassword: "" });
    setMode("login");
  };

  const submitLogin = async (e) => {
    e.preventDefault();
    if (!form.adminId || !form.password) return setError("Enter your Admin ID and password.");
    setBusy(true);
    const { ok, data } = await postJson("/api/admin/auth/login", { adminId: form.adminId, password: form.password });
    setBusy(false);
    if (!ok) return setError(data.error || "Invalid ID or password.");
    window.location.assign(target);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_rk.webp" alt="RefurbishedKart" className="mx-auto h-9 w-auto" />
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Admin Panel</p>
        </div>

        <div className="rounded-card border border-black/5 bg-white p-6 shadow-card">
          {mode === "loading" && <p className="py-8 text-center text-sm text-neutral-400">Loading…</p>}

          {mode === "setup" && (
            <form onSubmit={submitSetup} className="space-y-4">
              <div>
                <h1 className="text-lg font-bold text-ink">Set up admin account</h1>
                <p className="mt-1 text-[13px] text-neutral-500">First-time setup. This screen appears only once.</p>
              </div>
              <label className="block">
                <span className="mb-1 block text-[12px] font-semibold text-neutral-600">Admin ID</span>
                <input className={inputCls} value={form.adminId} autoComplete="username"
                  onChange={(e) => set("adminId", e.target.value.replace(/\s/g, ""))} placeholder="4–20 letters/numbers" />
              </label>
              <label className="block">
                <span className="mb-1 block text-[12px] font-semibold text-neutral-600">Password</span>
                <input type="password" className={inputCls} value={form.password} autoComplete="new-password"
                  onChange={(e) => set("password", e.target.value)} placeholder="Min 8 characters" />
              </label>
              <label className="block">
                <span className="mb-1 block text-[12px] font-semibold text-neutral-600">Confirm password</span>
                <input type="password" className={inputCls} value={form.confirmPassword} autoComplete="new-password"
                  onChange={(e) => set("confirmPassword", e.target.value)} placeholder="Re-enter password" />
              </label>
              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-[13px] font-semibold text-red-600">{error}</p>}
              <button type="submit" disabled={busy} className="w-full rounded-full bg-brand py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-50">
                {busy ? "Creating…" : "Create Admin Account"}
              </button>
            </form>
          )}

          {mode === "login" && (
            <form onSubmit={submitLogin} className="space-y-4">
              <div>
                <h1 className="text-lg font-bold text-ink">Admin login</h1>
                <p className="mt-1 text-[13px] text-neutral-500">Sign in with your Admin ID and password.</p>
              </div>
              {notice && <p className="rounded-lg bg-brand-soft px-3 py-2 text-[13px] font-semibold text-brand">{notice}</p>}
              <label className="block">
                <span className="mb-1 block text-[12px] font-semibold text-neutral-600">Admin ID</span>
                <input className={inputCls} value={form.adminId} autoComplete="username"
                  onChange={(e) => set("adminId", e.target.value.replace(/\s/g, ""))} placeholder="Your admin ID" />
              </label>
              <label className="block">
                <span className="mb-1 block text-[12px] font-semibold text-neutral-600">Password</span>
                <input type="password" className={inputCls} value={form.password} autoComplete="current-password"
                  onChange={(e) => set("password", e.target.value)} placeholder="Your password" />
              </label>
              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-[13px] font-semibold text-red-600">{error}</p>}
              <button type="submit" disabled={busy} className="w-full rounded-full bg-brand py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-50">
                {busy ? "Signing in…" : "Login"}
              </button>
              <button type="button" onClick={() => setForgot((v) => !v)} className="block w-full text-center text-[12px] font-semibold text-brand hover:underline">
                Forgot credentials?
              </button>
              {forgot && (
                <p className="rounded-lg bg-neutral-50 px-3 py-2 text-[12px] leading-relaxed text-neutral-500">
                  Credentials can be changed from Admin → Settings → Security while signed in (an OTP is emailed to the registered admin address). If you&apos;re fully locked out, the account must be reset directly in the database by your developer.
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-50" />}>
      <AdminLoginContent />
    </Suspense>
  );
}
