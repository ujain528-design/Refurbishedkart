import ProductCard from "@/components/ProductCard";
import SectionHeading from "@/components/SectionHeading";

export default function ProductRow({ title, subtitle, products, accessory, className = "" }) {
  return (
    <section className={`py-10 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading title={title} subtitle={subtitle}>
          {accessory}
        </SectionHeading>
        <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
