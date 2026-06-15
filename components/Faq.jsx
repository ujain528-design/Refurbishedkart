"use client";

import { useState } from "react";
import { FAQS } from "@/lib/data";
import { PlusMinusIcon } from "@/components/Icons";

function FaqItem({ item, open, onToggle }) {
  return (
    <div className="border-b border-black/5 last:border-b-0">
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-3.5 text-left lg:gap-6 lg:py-5"
      >
        <span className={`text-[0.82rem] font-semibold transition-colors duration-200 lg:text-[15px] ${open ? "text-brand" : "text-ink"}`}>
          {item.q}
        </span>
        <span
          className={`shrink-0 transition-colors duration-200 ${open ? "text-brand" : "text-neutral-400"}`}
        >
          <PlusMinusIcon open={open} className="h-5 w-5" />
        </span>
      </button>
      {/* smooth height transition via grid-rows trick */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <p className="pb-4 pr-6 text-[0.78rem] leading-snug text-neutral-500 lg:pb-6 lg:pr-10 lg:text-sm lg:leading-relaxed">{item.a}</p>
        </div>
      </div>
    </div>
  );
}

export default function Faq() {
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <section className="py-9 lg:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="section-heading">Frequently Asked Questions</h2>
        <div className="mt-4 lg:mt-8">
          {FAQS.map((item, i) => (
            <FaqItem
              key={item.q}
              item={item}
              open={openIdx === i}
              onToggle={() => setOpenIdx(openIdx === i ? -1 : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
