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
    <section className="py-20" style={{ background: "#E6EEF4" }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Find your price"
          accent="#1E4A6D"
          title="Shop by Budget"
          subtitle="Tell us your number — we'll show you the best machine it buys."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {BUDGET_TIERS.map((tier, i) => {
            const c = paletteAt(i).color;
            return (
              <button
                key={tier.cap}
                type="button"
                onClick={(e) => openModal(tier, e)}
                className="budget-card group block w-full rounded-card border border-warm-border bg-white p-8 text-left transition-colors duration-300"
                style={{ "--cc": c }}
              >
                <p className="text-2xl font-extrabold tracking-tight" style={{ color: c }}>
                  {tier.cap}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">{tier.blurb}</p>
                <p className="mt-4 text-[12px] font-semibold uppercase tracking-wide text-neutral-400">
                  {tier.examples}
                </p>
                <span className="mt-6 flex items-center gap-1.5 text-sm font-bold" style={{ color: c }}>
                  Explore
                  <ArrowRight
                    style={{ width: 16, height: 16 }}
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
