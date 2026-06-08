import { BUDGET_TIERS } from "@/lib/data";
import SectionHeading from "@/components/SectionHeading";
import { ArrowRight } from "@/components/Icons";

export default function BudgetCards() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Shop by Budget"
          subtitle="Tell us your number — we'll show you the best machine it buys."
        />
        <div className="grid gap-6 md:grid-cols-3">
          {BUDGET_TIERS.map((tier) => (
            <a
              key={tier.cap}
              href="#"
              className="group rounded-card bg-brand-soft p-8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover"
            >
              <p className="text-2xl font-extrabold tracking-tight text-brand">
                {tier.cap}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-neutral-600">{tier.blurb}</p>
              <p className="mt-4 text-[12px] font-semibold uppercase tracking-wide text-brand/60">
                {tier.examples}
              </p>
              <span className="mt-6 flex items-center gap-1.5 text-sm font-bold text-brand">
                Explore
                <ArrowRight
                  style={{ width: 16, height: 16 }}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
