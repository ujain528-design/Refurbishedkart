import Link from "next/link";
import { NAV_CATEGORIES } from "@/lib/data";
import { ChevronDown, LogoMark } from "@/components/Icons";
import BulkEnquiryTrigger from "@/components/BulkEnquiryTrigger";
import MobileNav from "@/components/MobileNav";
import SearchBar from "@/components/SearchBar";
import AccountIcon from "@/components/AccountIcon";
import MegaDropdown from "@/components/MegaDropdown";
import { WishlistNavIcon, CartNavIcon } from "@/components/NavTooltipIcon";

export default function Navbar() {
  return (
    <>
    <header className="fixed inset-x-0 top-0 z-50 bg-white shadow-nav">
      {/* Top row */}
      <div className="mx-auto flex h-[68px] max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="RefurbishedKart home">
          <LogoMark className="h-9 w-9 text-brand-mid" />
          <span className="text-[1.15rem] font-extrabold uppercase tracking-wide text-brand-mid">
            Refurbished&nbsp;Kart
          </span>
        </Link>

        {/* Search — pill, grey bg (in-row on desktop only; tablet gets its own row) */}
        <div className="hidden min-w-0 flex-1 justify-center lg:flex">
          <SearchBar className="w-full max-w-xl rounded-full bg-neutral-100 px-5 py-2.5 ring-1 ring-transparent transition-shadow focus-within:bg-white focus-within:ring-brand/40 focus-within:shadow-card" />
        </div>

        {/* Icons + CTA */}
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <AccountIcon />
          <WishlistNavIcon />
          <CartNavIcon />
          <BulkEnquiryTrigger className="ml-2 hidden rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark md:block">
            Bulk Enquiry
          </BulkEnquiryTrigger>
          {/* hamburger — mobile only */}
          <MobileNav />
        </div>
      </div>

      {/* Tablet (md–lg): search bar on its own full-width row */}
      <div className="hidden border-t border-black/5 md:block lg:hidden">
        <div className="mx-auto max-w-7xl px-4 py-2.5 sm:px-6">
          <SearchBar className="w-full rounded-full bg-neutral-100 px-5 py-2.5 ring-1 ring-transparent transition-shadow focus-within:bg-white focus-within:ring-brand/40 focus-within:shadow-card" />
        </div>
      </div>

      {/* Tablet (md–lg): horizontal scroll category strip — plain links, no dropdowns */}
      <nav className="hidden border-t border-black/5 md:block lg:hidden" aria-label="Categories">
        <div className="no-scrollbar mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-2 sm:px-6">
          {NAV_CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              href={`/products/${cat.name.toLowerCase()}`}
              className="shrink-0 rounded-full px-4 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-brand-softer hover:text-brand"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </nav>

      {/* Category row with mega dropdowns */}
      <nav className="hidden border-t border-black/5 lg:block">
        <ul className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-8">
          {NAV_CATEGORIES.map((cat) => (
            <li key={cat.name} className="group relative">
              <Link
                href={`/products/${cat.name.toLowerCase()}`}
                className="flex items-center gap-1.5 px-5 py-3 text-sm font-medium text-neutral-700 transition-colors group-hover:text-brand"
              >
                {cat.name}
                <ChevronDown
                  style={{ width: 14, height: 14 }}
                  className="transition-transform duration-300 group-hover:rotate-180"
                />
              </Link>
              {/* active underline */}
              <span className="absolute inset-x-5 bottom-0 h-[2.5px] origin-left scale-x-0 rounded-full bg-brand transition-transform duration-300 group-hover:scale-x-100" />
              <MegaDropdown category={cat} />
            </li>
          ))}
        </ul>
      </nav>
    </header>
    {/* spacer matching the fixed header's height per breakpoint:
        mobile 68px · tablet 68+54+42=164px · desktop 68+44=112px */}
    <div aria-hidden="true" className="h-[68px] md:h-[164px] lg:h-[112px]" />
    </>
  );
}
