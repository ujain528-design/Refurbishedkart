"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Scroll-reveal hook. Returns { ref, isVisible }.
 *
 * Attach `ref` to an element and toggle a class on `isVisible`, e.g.
 *   const { ref, isVisible } = useReveal();
 *   <div ref={ref} className={`fade-up ${isVisible ? "visible" : ""}`} />
 *
 * One-shot (stops observing after first entry). Honours prefers-reduced-motion
 * by reporting visible immediately so nothing stays stuck hidden.
 *
 * @param {Object}  [opts]
 * @param {number}  [opts.threshold=0.15]  IntersectionObserver threshold.
 * @param {string}  [opts.rootMargin="0px 0px -10% 0px"]  Trigger a touch early.
 * @param {boolean} [opts.once=true]  Reveal a single time.
 */
export default function useReveal({
  threshold = 0.15,
  rootMargin = "0px 0px -10% 0px",
  once = true,
} = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reduced motion or no IO support → reveal instantly.
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduce || typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) obs.disconnect();
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, isVisible };
}
