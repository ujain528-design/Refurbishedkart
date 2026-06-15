import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PolicyStrip from "@/components/PolicyStrip";
import BulkEnquiryModal from "@/components/BulkEnquiryModal";

/* Shared chrome + readable prose column for the static content pages. */
export default function StaticPage({ title, subtitle, children, wide = false }) {
  return (
    <>
      <Navbar />
      <main>
        <section className="border-b border-black/5 bg-offwhite">
          <div className="mx-auto max-w-4xl px-4 py-7 sm:px-6 lg:py-12">
            <h1 className="text-2xl font-extrabold tracking-tight text-ink lg:text-4xl">{title}</h1>
            {subtitle && <p className="mt-3 text-[13px] lg:text-[15px] text-neutral-500">{subtitle}</p>}
          </div>
        </section>
        <section className="py-7 lg:py-12">
          <div className={`mx-auto px-4 sm:px-6 ${wide ? "max-w-5xl" : "max-w-3xl"}`}>{children}</div>
        </section>
        <PolicyStrip />
      </main>
      <Footer />
      <BulkEnquiryModal />
    </>
  );
}

/* Prose helpers — keep static content consistent without a CSS library. */
export function H2({ children }) {
  return <h2 className="mt-9 text-lg lg:text-xl font-bold text-ink first:mt-0">{children}</h2>;
}
export function P({ children }) {
  return <p className="mt-3 text-[13px] lg:text-[15px] leading-relaxed text-neutral-600">{children}</p>;
}
export function UL({ items }) {
  return (
    <ul className="mt-3 space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex items-start gap-2.5 text-[13px] lg:text-[15px] leading-relaxed text-neutral-600">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}
