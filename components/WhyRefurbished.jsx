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
    <span className="text-[2.25rem] font-extrabold tracking-tight tabular-nums lg:text-6xl" style={{ color }}>
      {display}
      <span className="text-xl lg:text-4xl">{suffix}</span>
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
    <section className="bg-brand-softer py-9 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="section-heading">Why Buy Refurbished</h2>
        <div ref={ref} className="mt-6 grid gap-6 text-center md:grid-cols-3 lg:mt-12 lg:gap-8">
          {WHY_STATS.map((stat, i) => (
            <div key={stat.label} className="flex flex-col items-center">
              <span className="mb-2 inline-block h-2 w-2 rounded-full lg:mb-4 lg:h-2.5 lg:w-2.5" style={{ background: paletteAt(i).color }} aria-hidden="true" />
              <Counter target={stat.target} suffix={stat.suffix} started={started} color={paletteAt(i).color} />
              <p className="mt-2 text-[0.8rem] font-bold text-ink lg:mt-4 lg:text-[15px]">{stat.label}</p>
              <p className="mt-1 max-w-[260px] text-[0.72rem] leading-snug text-neutral-500 lg:mt-1.5 lg:text-sm lg:leading-normal">{stat.note}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
