"use client";

import { useEffect, useState } from "react";

/* Hinglish loading quotes — one is picked at random per slow navigation. */
export const QUOTES = [
  "Ek second... loading kar raha hai...",
  "Jugaad nahi, genuine refurbished hai yaar.",
  "Paisa vasool guaranteed.",
  "EMI bhi hai. Tension mat lo.",
  "Apna laptop, apna budget, apna choice.",
  "Desh mein sabse bharosemand refurbished store.",
  "Sasta nahi, smart hai.",
  "Amazon se sasta. Trust hamare jitna nahi.",
  "Startup ho ya student, budget mein best.",
  "Ghar baitha laptop aa jayega. Sach mein.",
  "GST invoice milega. CA khush rahega.",
  "Delhi se dispatch. India bhar delivery.",
  "Chai pi lo. Order pack ho raha hai.",
  "No jugaad. Full quality.",
  "Bulk order chahiye? Baat karte hain.",
  "Student discount nahi, student price hai yahan.",
  "Office ke liye bhi. Ghar ke liye bhi.",
  "Flipkart aur Amazon se compare karo. Fir aao.",
  "Made for India. Priced for India.",
  "Ek baar try karo. Dobara naya nahi loge.",
];

export const randomQuote = () => QUOTES[Math.floor(Math.random() * QUOTES.length)];

/* Full-screen transition overlay. Driven by `visible`; manages its own mount
   lifecycle so the fade-OUT (300ms) finishes before unmounting, while the
   fade-IN (200ms) plays on the frame after mount. CSS-only animation. */
export default function LoadingScreen({ visible, quote }) {
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false); // drives the opacity transition

  useEffect(() => {
    if (visible) {
      setMounted(true);
      // Flip opacity on the next frame so the 0 → 1 transition actually runs.
      const r = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(r);
    }
    // Fade out, then unmount once the 300ms transition has elapsed.
    setShown(false);
    const t = setTimeout(() => setMounted(false), 300);
    return () => clearTimeout(t);
  }, [visible]);

  if (!mounted) return null;

  return (
    <div className="rk-loading" data-shown={shown ? "true" : "false"} role="status" aria-live="polite">
      <span className="rk-loading__brand">RefurbishedKart</span>
      <p className="rk-loading__quote">{quote}</p>
      <div className="rk-loading__dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
