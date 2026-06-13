"use client";

import { useEffect, useRef, useState } from "react";
import { WHY_STATS } from "@/lib/data";
import { paletteAt } from "@/lib/categoryColors";

const DURATION = 2000; // ms
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

function Counter({ target, suffix, started, color }) {
  const [value, setValue] = useState(0);
  const decimals = Number.isInteger(target) ? 0 : 1; // 4.8 counts with one decimal

  useEffect(() => {
    if (!started) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) { setValue(target); return; }
    let raf;
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / DURATION);
      setValue(easeOutCubic(p) * target);
      if (p < 1) raf = requestAnimationFrame(step);
      else setValue(target);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [started, target]);

  const display = decimals ? value.toFixed(1) : Math.round(value).toLocaleString("en-IN");
  return (
    <span className="text-5xl font-extrabold tracking-tight tabular-nums md:text-6xl" style={{ color }}>
      {display}
      <span className="text-3xl md:text-4xl">{suffix}</span>
    </span>
  );
}

export default function WhyRefurbished() {
  const ref = useRef(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          obs.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="bg-brand-softer py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="section-heading">Why Buy Refurbished</h2>
        <div ref={ref} className="mt-12 grid gap-12 text-center md:grid-cols-3 md:gap-8">
          {WHY_STATS.map((stat, i) => (
            <div key={stat.label} className="flex flex-col items-center">
              <span className="mb-4 inline-block h-2.5 w-2.5 rounded-full" style={{ background: paletteAt(i).color }} aria-hidden="true" />
              <Counter target={stat.target} suffix={stat.suffix} started={started} color={paletteAt(i).color} />
              <p className="mt-4 text-[15px] font-bold text-ink">{stat.label}</p>
              <p className="mt-1.5 max-w-[260px] text-sm text-neutral-500">{stat.note}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
