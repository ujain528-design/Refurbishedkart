"use client";

import { useState } from "react";
import { BrokenDeviceIcon } from "@/components/Icons";

export default function Gallery({ images, alt }) {
  const [active, setActive] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-card border border-black/5 bg-neutral-100">
        <div className="flex flex-col items-center gap-3 text-neutral-300">
          <BrokenDeviceIcon style={{ width: 80, height: 80 }} />
          <span className="text-xs font-medium uppercase tracking-wider">Product Image</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* main image — zoom on hover */}
      <div className="group relative aspect-[4/3] overflow-hidden rounded-card border border-black/5 bg-white shadow-card">
        <img
          src={images[active]}
          alt={alt}
          className="h-full w-full object-contain p-8 transition-transform duration-500 ease-out group-hover:scale-110"
        />
      </div>

      {/* thumbnail strip — click swaps main */}
      {images.length > 1 && (
        <div className="mt-4 flex gap-3">
          {images.map((src, i) => (
            <button
              key={src}
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={active === i}
              className={`h-16 w-20 overflow-hidden rounded-lg border bg-white p-1.5 transition-all duration-200 ${
                active === i
                  ? "border-brand ring-2 ring-brand/25"
                  : "border-black/10 opacity-70 hover:opacity-100"
              }`}
            >
              <img src={src} alt="" className="h-full w-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
