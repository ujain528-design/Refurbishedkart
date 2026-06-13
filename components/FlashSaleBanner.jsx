import Link from "next/link";
import Countdown from "@/components/Countdown";

// Warmer than the old hard red — burnt orange from the category palette keeps the
// urgency while reading premium against the cream storefront.
const SALE_RED = "#B5532A";

export default function FlashSaleBanner() {
  return (
    <section className="py-10">
      {/* Entire banner is one link — full width, brightness lift on hover */}
      <Link
        href="/flash-sale"
        className="block w-full cursor-pointer transition-[filter] duration-300 hover:brightness-110"
        style={{ backgroundColor: SALE_RED }}
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-4 py-10 sm:px-6 lg:px-8">
          <div>
            <p className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
              🔥 FLASH SALE
            </p>
            <p className="mt-2 text-sm text-white/85 md:text-base">
              Limited time deals — up to 60% off on refurbished laptops &amp; desktops
            </p>
          </div>
          <Countdown onDark />
        </div>
      </Link>
    </section>
  );
}
