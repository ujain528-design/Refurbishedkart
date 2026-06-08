"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";

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

const OTP_LEN = 6;

export default function LoginView() {
  const router = useRouter();
  const params = useSearchParams();
  // ?redirect= (checkout gate) takes priority over ?next= (account gate)
  const redirect = params.get("redirect");
  const next = redirect || params.get("next") || "/account";
  const { login } = useAuth();

  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);
  const [otp, setOtp] = useState(Array(OTP_LEN).fill(""));
  const [seconds, setSeconds] = useState(30);
  const boxRefs = useRef([]);

  useEffect(() => {
    if (!sent || seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [sent, seconds]);

  const sendOtp = () => {
    if (phone.replace(/\D/g, "").length < 10) return;
    setSent(true);
    setSeconds(30);
    setOtp(Array(OTP_LEN).fill(""));
    setTimeout(() => boxRefs.current[0]?.focus(), 50);
  };

  const setDigit = (i, v) => {
    const d = v.replace(/\D/g, "").slice(-1);
    setOtp((prev) => {
      const n = [...prev];
      n[i] = d;
      return n;
    });
    if (d && i < OTP_LEN - 1) boxRefs.current[i + 1]?.focus();
  };

  const onKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) boxRefs.current[i - 1]?.focus();
  };

  const finish = (partial) => {
    login(partial);
    router.push(next);
  };

  const otpComplete = otp.every((d) => d !== "");

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16">
      <div className="w-full rounded-card border border-black/5 bg-white p-7 shadow-card sm:p-8">
        <h1 className="text-center text-2xl font-extrabold tracking-tight text-ink">Sign in to RefurbishedKart</h1>
        {redirect === "/checkout" ? (
          <p className="mt-2 rounded-lg bg-brand-softer px-4 py-2.5 text-center text-sm font-semibold text-brand">
            Please sign in to complete your order
          </p>
        ) : (
          <p className="mt-1.5 text-center text-sm text-neutral-500">New here? Signing in with your phone creates your account.</p>
        )}

        {/* Google */}
        <button
          onClick={() => finish({})}
          className="mt-7 flex w-full items-center justify-center gap-3 rounded-full border border-black/15 bg-white py-3 text-sm font-bold text-ink transition-colors hover:bg-neutral-50"
        >
          <GoogleGlyph /> Continue with Google
        </button>

        {/* divider */}
        <div className="my-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-black/10" />
          <span className="text-[12px] font-semibold text-neutral-400">OR</span>
          <span className="h-px flex-1 bg-black/10" />
        </div>

        {/* phone OTP */}
        {!sent ? (
          <div>
            <label className="mb-1.5 block text-[12px] font-semibold text-neutral-600">Phone number</label>
            <div className="flex overflow-hidden rounded-full border border-black/10 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15">
              <span className="flex items-center bg-neutral-100 px-4 text-sm font-semibold text-neutral-600">+91</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                inputMode="numeric"
                placeholder="98765 43210"
                className="w-full bg-transparent px-4 py-3 text-sm text-ink focus:outline-none"
              />
            </div>
            <button
              onClick={sendOtp}
              disabled={phone.length < 10}
              className="mt-4 w-full rounded-full bg-brand py-3 text-sm font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-40"
            >
              Send OTP
            </button>
          </div>
        ) : (
          <div>
            <p className="mb-3 text-center text-sm text-neutral-500">
              Enter the 6-digit code sent to <span className="font-semibold text-ink">+91 {phone}</span>
            </p>
            <div className="flex justify-center gap-2">
              {otp.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => (boxRefs.current[i] = el)}
                  value={d}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => onKeyDown(i, e)}
                  inputMode="numeric"
                  maxLength={1}
                  className="h-12 w-11 rounded-lg border border-black/15 text-center text-lg font-bold text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
                />
              ))}
            </div>
            <div className="mt-3 text-center text-[13px] text-neutral-400">
              {seconds > 0 ? (
                <span>Resend OTP in 0:{String(seconds).padStart(2, "0")}</span>
              ) : (
                <button onClick={sendOtp} className="font-bold text-brand hover:underline">Resend OTP</button>
              )}
            </div>
            <button
              onClick={() => finish({ phone: `+91 ${phone}` })}
              disabled={!otpComplete}
              className="mt-4 w-full rounded-full bg-brand py-3 text-sm font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-40"
            >
              Verify OTP
            </button>
            <button onClick={() => setSent(false)} className="mt-3 w-full text-[13px] font-semibold text-neutral-500 hover:text-ink">
              ← Change number
            </button>
          </div>
        )}
      </div>

      <p className="mt-5 max-w-xs text-center text-[12px] leading-relaxed text-neutral-400">
        By continuing you agree to our{" "}
        <Link href="/terms" className="text-brand hover:underline">Terms of Service</Link> and{" "}
        <Link href="/privacy-policy" className="text-brand hover:underline">Privacy Policy</Link>.
      </p>
    </div>
  );
}
