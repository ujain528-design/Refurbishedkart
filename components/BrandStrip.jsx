import { BRANDS } from "@/lib/data";
import SectionHeading from "@/components/SectionHeading";

export default function BrandStrip() {
  return (
    <section className="bg-offwhite py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          title="Shop by Brand"
          subtitle="Enterprise-grade hardware from the names IT departments trust."
        />
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {BRANDS.map((brand) => (
            <a
              key={brand}
              href="#"
              className="flex h-20 items-center justify-center rounded-card border border-black/5 bg-white text-[15px] font-bold tracking-wide text-neutral-500 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:text-brand hover:shadow-card-hover"
            >
              {brand}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
