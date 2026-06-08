"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" style={{ width: 18, height: 18 }} aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-5 6.7-5Z" />
    </svg>
  );
}

export default function LoginView() {
  const params = useSearchParams();
  // ?redirect= (checkout gate) takes priority over ?next= (account gate)
  const redirect = params.get("redirect");
  const next = redirect || params.get("next") || "/account";

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const googleLogin = () => {
    setError("");
    setBusy(true);
    // NextAuth handles the Google OAuth round-trip; on return, GoogleSessionBridge
    // hands the session's app-JWT to AuthContext. callbackUrl brings us back to `next`.
    signIn("google", { callbackUrl: next });
  };

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16">
      <div className="w-full rounded-card border border-black/5 bg-white p-7 shadow-card sm:p-8">
        <h1 className="text-center text-2xl font-extrabold tracking-tight text-ink">Sign in to RefurbishedKart</h1>
        {redirect === "/checkout" ? (
          <p className="mt-2 rounded-lg bg-brand-softer px-4 py-2.5 text-center text-sm font-semibold text-brand">
            Please sign in to complete your order
          </p>
        ) : (
          <p className="mt-1.5 text-center text-sm text-neutral-500">New here? Signing in with Google creates your account.</p>
        )}

        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-center text-[13px] font-semibold text-red-600">{error}</p>}

        {/* Google (dev login — real OAuth needs Google credentials) */}
        <button
          onClick={googleLogin}
          disabled={busy}
          className="mt-7 flex w-full items-center justify-center gap-3 rounded-full border border-black/15 bg-white py-3 text-sm font-bold text-ink transition-colors hover:bg-neutral-50 disabled:opacity-50"
        >
          <GoogleGlyph /> Continue with Google
        </button>

        {/* divider */}
        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-black/10" />
          <span className="text-[12px] font-semibold text-neutral-400">OR</span>
          <span className="h-px flex-1 bg-black/10" />
        </div>

        {/* phone OTP — coming soon (email-OTP backend exists; disabled per spec) */}
        <div className="rounded-card border border-dashed border-black/15 bg-neutral-50 px-4 py-5 text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <span className="text-sm font-bold text-ink">Phone OTP login</span>
            <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-neutral-500">Coming soon</span>
          </div>
          <p className="text-[13px] text-neutral-500">Sign in with Google for now — phone OTP is on the way.</p>
        </div>
      </div>

      <p className="mt-5 max-w-xs text-center text-[12px] leading-relaxed text-neutral-400">
        By continuing you agree to our{" "}
        <Link href="/terms" className="text-brand hover:underline">Terms of Service</Link> and{" "}
        <Link href="/privacy-policy" className="text-brand hover:underline">Privacy Policy</Link>.
      </p>
    </div>
  );
}
