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
        className="flex w-full items-center justify-between gap-6 py-5 text-left"
      >
        <span className={`text-[15px] font-semibold transition-colors duration-200 ${open ? "text-brand" : "text-ink"}`}>
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
          <p className="pb-6 pr-10 text-sm leading-relaxed text-neutral-500">{item.a}</p>
        </div>
      </div>
    </div>
  );
}

export default function Faq() {
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <section className="py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="section-heading">Frequently Asked Questions</h2>
        <div className="mt-8">
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
