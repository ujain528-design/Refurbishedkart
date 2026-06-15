"use client";

import { useRef } from "react";
import { ChevronRight, COMPONENT_ICONS } from "@/components/Icons";

/* Inspection checkpoint cards — horizontal scroll, ~2.5 visible to tempt
   scrolling. Any card opens the full inspection panel. */
const GRADIENTS = [
  "linear-gradient(135deg, #fce4ec, #f8bbd0)",
  "linear-gradient(135deg, #e8eaf6, #c5cae9)",
  "linear-gradient(135deg, #e0f2f1, #b2dfdb)",
  "linear-gradient(135deg, #fff8e1, #ffecb3)",
  "linear-gradient(135deg, #f3e5f5, #e1bee7)",
];

const CARDS = [
  { name: "Battery Health", key: "battery" },
  { name: "Screen", key: "display" },
  { name: "Keyboard", key: "keyboard" },
  { name: "Ports", key: "ports" },
  { name: "Body / Chassis", key: "body" },
  { name: "Performance", key: "performance" },
  { name: "RAM", key: "ram" },
  { name: "Storage", key: "storage" },
  { name: "Speakers", key: "speakers" },
  { name: "Webcam", key: "webcam" },
];

export default function CheckpointCards({ onOpen }) {
  const scroller = useRef(null);
  const scrollBy = (dir) => scroller.current?.scrollBy({ left: dir * 280, behavior: "smooth" });

  return (
    <section className="mt-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h3 className="text-[13px] font-bold tracking-tight text-ink lg:text-[15px]">Nothing Hidden. Everything Checked.</h3>
          <p className="mt-0.5 text-[12px] text-neutral-500">
            Every device goes through our 14-point inspection before it reaches you.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            aria-label="Scroll left"
            onClick={() => scrollBy(-1)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-black/10 text-neutral-500 transition-colors hover:border-brand hover:text-brand"
          >
            <ChevronRight style={{ width: 15, height: 15 }} className="rotate-180" />
          </button>
          <button
            aria-label="Scroll right"
            onClick={() => scrollBy(1)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-black/10 text-neutral-500 transition-colors hover:border-brand hover:text-brand"
          >
            <ChevronRight style={{ width: 15, height: 15 }} />
          </button>
        </div>
      </div>

      <div ref={scroller} className="no-scrollbar mt-3 flex gap-2.5 overflow-x-auto pb-1">
        {CARDS.map((c, i) => {
          const Icon = COMPONENT_ICONS[c.key];
          return (
            <button
              key={c.name}
              onClick={onOpen}
              style={{ width: 100, height: 104, background: GRADIENTS[i % GRADIENTS.length], borderRadius: 12 }}
              className="relative flex shrink-0 flex-col justify-between p-2.5 text-left shadow-card transition-transform duration-200 hover:-translate-y-1"
            >
              {Icon && <Icon style={{ width: 22, height: 22 }} className="text-ink/70" />}
              <span className="text-[12px] font-bold leading-tight text-ink">{c.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
