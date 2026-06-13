import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import SectionHeading from "@/components/SectionHeading";

export default function ProductRow({ title, subtitle, eyebrow, viewAllHref, products, accessory, className = "" }) {
  return (
    <section className={`py-10 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading title={title} subtitle={subtitle} eyebrow={eyebrow}>
          {viewAllHref ? (
            <Link
              href={viewAllHref}
              className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-ink transition-colors hover:text-[#B8860B]"
            >
              View All
              <span className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true">→</span>
            </Link>
          ) : (
            accessory
          )}
        </SectionHeading>
        <div className="no-scrollbar -mx-4 flex items-stretch snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
