"use client";

import { useRef, useState } from "react";
import { BUDGET_TIERS } from "@/lib/data";
import SectionHeading from "@/components/SectionHeading";
import { ArrowRight } from "@/components/Icons";
import { paletteAt } from "@/lib/categoryColors";
import BudgetCategoryModal from "@/components/BudgetCategoryModal";

// "Under ₹15,000" → { min: 0, max: 15000 }. (Tiers are upper-bound only.)
const tierRange = (cap) => ({ min: 0, max: Number(String(cap).replace(/[^\d]/g, "")) || 0 });

export default function BudgetCards() {
  const [active, setActive] = useState(null); // { cap, min, max }
  const triggerRef = useRef(null);

  const openModal = (tier, e) => {
    triggerRef.current = e.currentTarget;
    setActive({ cap: tier.cap, ...tierRange(tier.cap) });
  };
  const closeModal = () => {
    setActive(null);
    // return focus to the tier that opened the modal
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
        <div className="grid gap-3 md:grid-cols-3 lg:gap-6">
          {BUDGET_TIERS.map((tier, i) => {
            const c = paletteAt(i).color;
            return (
              <button
                key={tier.cap}
                type="button"
                onClick={(e) => openModal(tier, e)}
                className="budget-card group block w-full rounded-card border border-warm-border bg-white p-4 text-left transition-colors duration-300 lg:p-8"
                style={{ "--cc": c }}
              >
                <p className="text-lg font-extrabold tracking-tight lg:text-2xl" style={{ color: c }}>
                  {tier.cap}
                </p>
                <p className="mt-1.5 text-[0.78rem] leading-snug text-neutral-600 lg:mt-3 lg:text-sm lg:leading-relaxed">{tier.blurb}</p>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-400 lg:mt-4 lg:text-[12px]">
                  {tier.examples}
                </p>
                <span className="mt-3 flex items-center gap-1.5 text-[0.8rem] font-bold lg:mt-6 lg:text-sm" style={{ color: c }}>
                  Explore
                  <ArrowRight
                    style={{ width: 15, height: 15 }}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {active && <BudgetCategoryModal tier={active} onClose={closeModal} />}
    </section>
  );
}
