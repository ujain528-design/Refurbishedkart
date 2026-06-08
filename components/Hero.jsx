import { TRUST_BADGES } from "@/lib/data";
import HeroCarousel from "@/components/HeroCarousel";

/* Hero = full-width poster carousel + trust badge strip.
   (Refurbishment-journey animation removed by user decision — PRD §4.1
   needs a matching update.) */
export default function Hero() {
  return (
    <section className="bg-offwhite pb-14">
      <HeroCarousel />

      {/* Trust badges — green pill chips (unchanged) */}
      <div className="mx-auto mt-10 flex max-w-7xl flex-wrap items-center justify-center gap-3 px-4 sm:px-6 lg:px-8">
        {TRUST_BADGES.map((badge) => (
          <span
            key={badge}
            className="rounded-full bg-brand-soft px-4 py-2 text-[13px] font-semibold text-brand"
          >
            {badge}
          </span>
        ))}
      </div>
    </section>
  );
}
