"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { NAV_CATEGORIES } from "@/lib/data";
import { ChevronDown, LogoMark } from "@/components/Icons";
import BulkEnquiryTrigger from "@/components/BulkEnquiryTrigger";
import MobileBottomNav from "@/components/MobileBottomNav";
import SearchBar from "@/components/SearchBar";
import AccountIcon from "@/components/AccountIcon";
import MegaDropdown from "@/components/MegaDropdown";
import { WishlistNavIcon, CartNavIcon } from "@/components/NavTooltipIcon";

/* Apple-minimal navbar (Warm Tech): cream bg + 1px warm border, two-weight
   wordmark, rounded-square search with green focus glow, amber Bulk Enquiry.
   Past 68px the bar gets a translucent cream blur + soft shadow. */

// Rounded-square search: white, warm border, green focus ring (shared md/lg).
const SEARCH_CLS =
  "w-full rounded-lg border border-warm-border bg-white px-4 py-2.5 transition-[border-color,box-shadow] duration-150 focus-within:border-brand focus-within:shadow-[0_0_0_3px_rgba(45,80,22,0.06)]";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 68);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-[var(--ann-h,0px)] z-50 border-b border-warm-border transition-all duration-[250ms] ease-out ${
          scrolled
            ? "bg-[rgba(250,248,245,0.94)] shadow-[0_1px_16px_rgba(0,0,0,0.06)] backdrop-blur-[16px]"
            : "bg-warm-bg"
        }`}
      >
        {/* Top row — fixed 68px */}
        <div className="mx-auto flex h-[68px] max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
          {/* Logo — two-weight wordmark */}
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="RefurbishedKart home">
            <LogoMark className="h-8 w-8 text-brand" />
            <span className="text-[1.35rem] tracking-tight">
              <span className="font-bold text-dark">Refurbished</span>
              <span className="font-extrabold text-brand">Kart</span>
            </span>
          </Link>

          {/* Search — in-row on desktop only; tablet gets its own row */}
          <div className="hidden min-w-0 flex-1 justify-center lg:flex">
            <div className="w-full max-w-xl">
              <SearchBar className={SEARCH_CLS} />
            </div>
          </div>

          {/* Icons + CTA. On mobile the bar is slimmed to logo + cart only —
              Account/Wishlist/Bulk + categories/search move to the bottom bar. */}
          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            <div className="hidden items-center gap-1 sm:gap-2 lg:flex">
              <AccountIcon />
              <WishlistNavIcon />
            </div>
            <CartNavIcon />
            <BulkEnquiryTrigger className="ml-2 hidden rounded-[7px] bg-accent px-5 py-2.5 text-sm font-semibold text-dark transition-colors hover:bg-[#d4911c] lg:block">
              Bulk Enquiry
            </BulkEnquiryTrigger>
          </div>
        </div>

        {/* Category row with mega dropdowns (desktop) */}
        <nav className="hidden border-t border-warm-border lg:block">
          <ul className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-8">
            {NAV_CATEGORIES.map((cat) => (
              <li key={cat.name} className="group relative">
                <Link
                  href={`/products/${cat.name.toLowerCase()}`}
                  className="flex items-center gap-1.5 px-5 py-3 text-sm font-medium text-[#2c2c2e] transition-colors group-hover:text-brand"
                >
                  {cat.name}
                  <ChevronDown
                    style={{ width: 14, height: 14 }}
                    className="transition-transform duration-200 group-hover:rotate-180"
                  />
                </Link>
                {/* underline slides 0 → full on hover */}
                <span className="absolute inset-x-5 bottom-0 h-[1.5px] origin-left scale-x-0 rounded-full bg-brand transition-transform duration-200 ease-out group-hover:scale-x-100" />
                <MegaDropdown category={cat} />
              </li>
            ))}
          </ul>
        </nav>
      </header>
      {/* spacers — announcement bar + fixed header height per breakpoint:
          below-lg 68px (slim single row) · desktop 68+45≈113 */}
      <div aria-hidden="true" style={{ height: "var(--ann-h, 0px)" }} />
      <div aria-hidden="true" className="h-[68px] lg:h-[113px]" />

      {/* App-style bottom navigation — mobile/tablet only (hidden on lg+) */}
      <MobileBottomNav />
    </>
  );
}
