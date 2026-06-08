"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NAV_CATEGORIES } from "@/lib/data";
import { MenuIcon, CloseIcon } from "@/components/Icons";
import BulkEnquiryTrigger from "@/components/BulkEnquiryTrigger";
import SearchBar from "@/components/SearchBar";

/* Mobile (<768px) hamburger + slide-in drawer:
   search on top, categories with brands below, Bulk Enquiry at bottom. */
export default function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="rounded-full p-2.5 text-neutral-600 transition-colors hover:bg-brand-softer hover:text-brand md:hidden"
      >
        <MenuIcon style={{ width: 22, height: 22 }} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[95] md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-ink/50 animate-overlay-in" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[300px] flex-col bg-white shadow-card-hover animate-modal-in">
            {/* header */}
            <div className="flex items-center justify-between border-b border-black/5 px-4 py-3.5">
              <p className="text-sm font-bold text-ink">Menu</p>
              <button
                aria-label="Close menu"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-neutral-400 hover:bg-neutral-100 hover:text-ink"
              >
                <CloseIcon style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {/* search */}
            <div className="border-b border-black/5 p-4">
              <SearchBar
                className="rounded-full bg-neutral-100 px-4 py-2.5"
                iconSize={16}
                placeholder="Search products…"
                onNavigate={() => setOpen(false)}
              />
            </div>

            {/* categories with brands */}
            <nav className="flex-1 overflow-y-auto px-4 py-3">
              {NAV_CATEGORIES.map((cat) => {
                const base = `/products/${cat.name.toLowerCase()}`;
                return (
                  <div key={cat.name} className="border-b border-black/5 py-3 last:border-b-0">
                    <Link
                      href={base}
                      onClick={() => setOpen(false)}
                      className="text-[15px] font-bold text-ink hover:text-brand"
                    >
                      {cat.name}
                    </Link>
                    <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1">
                      {cat.brands.map((brand) => (
                        <Link
                          key={brand}
                          href={`${base}?brand=${encodeURIComponent(brand)}`}
                          onClick={() => setOpen(false)}
                          className="rounded-md px-1.5 py-1 text-[13px] text-neutral-500 hover:bg-brand-softer hover:text-brand"
                        >
                          {brand}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </nav>

            {/* bulk enquiry pinned at bottom */}
            <div className="border-t border-black/5 p-4">
              <BulkEnquiryTrigger className="w-full rounded-full bg-brand py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark">
                Bulk Enquiry
              </BulkEnquiryTrigger>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
