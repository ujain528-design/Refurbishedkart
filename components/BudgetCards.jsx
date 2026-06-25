"use client";

import { useRef, useState } from "react";
import { PRICE_BUCKETS } from "@/lib/priceBuckets";
import SectionHeading from "@/components/SectionHeading";
import { ArrowRight } from "@/components/Icons";
import { paletteAt } from "@/lib/categoryColors";
import BudgetCategoryModal from "@/components/BudgetCategoryModal";

const BUCKETS = Object.values(PRICE_BUCKETS);

export default function BudgetCards() {
  const [active, setActive] = useState(null); // bucket { slug, label, tagline }
  const triggerRef = useRef(null);

  const openModal = (bucket, e) => {
    triggerRef.current = e.currentTarget;
    setActive(bucket);
  };
  const closeModal = () => {
    setActive(null);
    triggerRef.current?.focus();
  };

  return (
    <section className="py-8 lg:py-20" style={{ background: "#E6EEF4" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Find your price"
          accent="#1E4A6D"
          title="Shop by Budget"
          subtitle="Tell us your number — we'll show you the best machine it buys."
        />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-6">
          {BUCKETS.map((bucket, i) => {
            const c = paletteAt(i).color;
            return (
              <button
                key={bucket.slug}
                type="button"
                onClick={(e) => openModal(bucket, e)}
                className="budget-card group block w-full rounded-card border border-warm-border bg-white p-4 text-left transition-colors duration-300 lg:p-8"
                style={{ "--cc": c }}
              >
                <p className="text-base font-extrabold tracking-tight lg:text-2xl" style={{ color: c }}>{bucket.label}</p>
                <p className="mt-1.5 text-[0.78rem] leading-snug text-neutral-600 lg:mt-3 lg:text-sm lg:leading-relaxed">{bucket.tagline}</p>
                <span className="mt-3 flex items-center gap-1.5 text-[0.8rem] font-bold lg:mt-6 lg:text-sm" style={{ color: c }}>
                  Explore
                  <ArrowRight style={{ width: 15, height: 15 }} className="transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {active && <BudgetCategoryModal bucket={active} onClose={closeModal} />}
    </section>
  );
}
