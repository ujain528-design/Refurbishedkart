"use client";

import { useEffect, useState } from "react";

/* Hinglish quotes tagged by surface/mood. Each surface draws only from its own
   pool so the tone fits the moment (e.g. no "compare with Amazon" jab on the
   page where a customer just paid). */

// Loading screen — cheeky / waiting.
export const LOADING_QUOTES = [
  "Ek second... loading kar raha hai...",
  "Chai pi lo. Order pack ho raha hai.",
  "Defragmenting your shopping experience...",
  "Checking if the RAM is actually 8GB...",
  "Polishing the pixels just for you...",
  "Running diagnostics on your patience...",
];

// Order confirmation — celebratory / reassuring (customer just paid).
export const CONFIRM_QUOTES = [
  "Paisa vasool guaranteed.",
  "GST invoice milega. CA khush rahega.",
  "Delhi se dispatch. India bhar delivery.",
  "Ghar baitha laptop aa jayega. Sach mein.",
  "Ek baar try karo. Dobara naya nahi loge.",
  "1 year warranty. Because we stand behind every device.",
  "7-day returns. Because trust works both ways.",
];

// Empty cart — encouraging / nudging.
export const CART_QUOTES = [
  "Apna laptop, apna budget, apna choice.",
  "EMI bhi hai. Tension mat lo.",
  "Startup ho ya student, budget mein best.",
  "Office ke liye bhi. Ghar ke liye bhi.",
  "Sasta nahi, smart hai.",
  "Made for India. Priced for India.",
];

// No search results — helpful / redirecting.
export const SEARCH_QUOTES = [
  "Bulk order chahiye? Baat karte hain.",
  "Student discount nahi, student price hai yahan.",
  "Desh mein sabse bharosemand refurbished store.",
  "No jugaad. Full quality.",
  "Amazon se sasta. Trust hamare jitna nahi.",
];

const pick = (pool) => pool[Math.floor(Math.random() * pool.length)];

export const randomQuote = () => pick(LOADING_QUOTES);        // loading screen
export const randomConfirmQuote = () => pick(CONFIRM_QUOTES);  // order confirmation
export const randomCartQuote = () => pick(CART_QUOTES);        // empty cart
export const randomSearchQuote = () => pick(SEARCH_QUOTES);    // no search results

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
