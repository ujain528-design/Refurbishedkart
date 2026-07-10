import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PolicyStrip from "@/components/PolicyStrip";
import BulkEnquiryModal from "@/components/BulkEnquiryModal";

export const metadata = {
  title: "About Us | RefurbishedKart - Certified Refurbished Laptops India",
  description:
    "RefurbishedKart is India's trusted refurbished electronics store. ISO 14001 certified, 18,500+ devices refurbished, serving all of India since 2023.",
  alternates: { canonical: "https://refurbishedkart.com/about" },
};

const STATS = [
  ["18,500+", "Devices Refurbished"],
  ["Since 2023", "In Operation"],
  ["25–30", "Expert Team Members"],
  ["Pan India", "Delivery"],
];

const WHY = [
  ["💰", "Save Up to 60%", "Same enterprise-grade hardware. Same performance. Up to 60% less than buying new. Your budget goes further with refurbished."],
  ["🔒", "Certified & Warrantied", "Every device is professionally tested by our technical team and comes with warranty. You buy with confidence, not compromise."],
  ["🌱", "Good for the Planet", "Every refurbished device keeps electronic waste out of landfills and reduces the demand for new manufacturing. Choosing refurbished is choosing sustainability."],
];

const SERVE = [
  ["🎓", "Students", "Affordable laptops for college and university — reliable machines that handle everything from assignments to coding."],
  ["💼", "Professionals", "Premium business laptops at honest prices. Dell, HP, Lenovo ThinkPad — the brands professionals trust."],
  ["🚀", "Startups & SMEs", "Equip your team without breaking the budget. Bulk orders with GST invoices and dedicated support."],
  ["🏢", "Enterprises", "Large-scale IT asset procurement and refresh. Hundreds of verified enterprise clients trust RefurbishedKart for bulk orders."],
];

function SectionHeading({ children }) {
  return <h2 className="section-heading text-center !text-2xl lg:!text-3xl">{children}</h2>;
}

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main>
        {/* 1 — Hero */}
        <section style={{ background: "#0a1a0a" }}>
          <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:py-24">
            <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              Making Quality Tech Accessible for Every Indian
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-white/70 lg:text-lg">
              Certified refurbished electronics — tested, warrantied, and delivered across India.
            </p>
          </div>
        </section>

        {/* 1b — Brand slogan pull quote */}
        <section className="py-14 lg:py-20">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <span className="mx-auto block h-px w-16 bg-brand/30" aria-hidden="true" />
            <blockquote className="my-7 font-display text-2xl font-light italic leading-snug tracking-[-0.01em] text-brand sm:text-3xl lg:my-9 lg:text-4xl">
              &ldquo;The Confidence of New, in a Refurbished Shell.&rdquo;
            </blockquote>
            <span className="mx-auto block h-px w-16 bg-brand/30" aria-hidden="true" />
          </div>
        </section>

        {/* 2 — Our story */}
        <section className="py-12 lg:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <SectionHeading>Our Story</SectionHeading>
            <div className="mt-6 space-y-4 text-[14px] leading-relaxed text-neutral-600 lg:mt-8 lg:text-[15px]">
              <p>RefurbishedKart was founded in 2023 with a simple mission — to make quality technology accessible and affordable for every Indian.</p>
              <p>We saw a gap in the market: millions of Indians needed reliable laptops, desktops, and electronics for work, study, and business — but new device prices put them out of reach. At the same time, perfectly functional enterprise-grade hardware was being discarded or sitting idle.</p>
              <p>We bridge that gap. Every device we sell is professionally refurbished, rigorously tested, and backed by warranty — so you get premium technology at a fraction of the new price.</p>
            </div>
          </div>
        </section>

        {/* 3 — Stats */}
        <section className="bg-brand-softer/40 py-12 lg:py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
              {STATS.map(([num, label]) => (
                <div key={label} className="rounded-card border border-black/5 bg-white p-6 text-center shadow-card">
                  <p className="font-display text-2xl font-extrabold tracking-tight text-brand lg:text-4xl">{num}</p>
                  <p className="mt-2 text-[13px] font-semibold text-neutral-500 lg:text-sm">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4 — Mission */}
        <section className="py-12 lg:py-20">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <SectionHeading>Our Mission</SectionHeading>
            <div className="mt-6 space-y-4 text-[14px] leading-relaxed text-neutral-600 lg:mt-8 lg:text-[15px]">
              <p>Our mission is simple: provide every Indian with access to quality technology at honest prices.</p>
              <p>We believe technology should not be a luxury. Whether you&apos;re a student buying your first laptop, a startup building a team, or an enterprise refreshing 500 workstations — RefurbishedKart has you covered.</p>
            </div>
          </div>
        </section>

        {/* 5 — Why refurbished */}
        <section className="bg-brand-softer/40 py-12 lg:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading>Why Refurbished?</SectionHeading>
            <div className="mt-8 grid gap-5 md:grid-cols-3 lg:mt-12 lg:gap-7">
              {WHY.map(([icon, title, body]) => (
                <div key={title} className="rounded-card border border-black/5 bg-white p-6 shadow-card lg:p-7">
                  <span className="text-3xl" aria-hidden="true">{icon}</span>
                  <h3 className="mt-4 text-base font-bold text-ink lg:text-lg">{title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-neutral-600 lg:text-sm">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6 — Certification */}
        <section className="py-12 lg:py-20">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 px-4 text-center sm:px-6 md:flex-row md:text-left">
            {/* ISO badge — green circle */}
            <div className="flex h-32 w-32 shrink-0 flex-col items-center justify-center rounded-full border-4 border-brand bg-brand-soft text-brand">
              <span className="text-[11px] font-bold uppercase tracking-wider">ISO</span>
              <span className="font-display text-2xl font-extrabold leading-none">14001</span>
              <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide">Certified</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink lg:text-2xl">ISO 14001 Certified</h2>
              <div className="mt-3 space-y-3 text-[14px] leading-relaxed text-neutral-600 lg:text-[15px]">
                <p>RefurbishedKart operates under MMT Global Recycling Pvt. Ltd., certified to ISO 14001 — the international standard for Environmental Management Systems.</p>
                <p>This means our refurbishment and e-waste processes meet the highest global standards for environmental responsibility.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 7 — Who we serve */}
        <section className="bg-brand-softer/40 py-12 lg:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading>Who We Serve</SectionHeading>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4 lg:gap-6">
              {SERVE.map(([icon, title, body]) => (
                <div key={title} className="rounded-card border border-black/5 bg-white p-6 shadow-card">
                  <span className="text-3xl" aria-hidden="true">{icon}</span>
                  <h3 className="mt-4 text-base font-bold text-ink">{title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-neutral-600">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 8 — Powered by MMT Global */}
        <section className="py-12 lg:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <SectionHeading>Powered by MMT Global</SectionHeading>
            <div className="mt-6 space-y-4 text-[14px] leading-relaxed text-neutral-600 lg:mt-8 lg:text-[15px]">
              <p>RefurbishedKart is powered by MMT Global Recycling Pvt. Ltd. — one of India&apos;s leading IT Asset Disposition (ITAD) and e-waste recycling companies.</p>
              <p>With deep expertise in responsible technology lifecycle management, MMT Global brings enterprise-grade processes to every device we sell.</p>
            </div>
            <div className="mt-5 rounded-card border border-black/5 bg-white p-5 shadow-card">
              <p className="text-[12px] font-semibold uppercase tracking-wide text-neutral-400">Registered office</p>
              <p className="mt-1 text-[14px] font-semibold text-ink">
                147, Patparganj Industrial Area, Near Anand Vihar, Delhi – 110092
              </p>
            </div>
          </div>
        </section>

        {/* 9 — CTA */}
        <section style={{ background: "#0a1a0a" }}>
          <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6 lg:py-20">
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-white lg:text-3xl">Ready to find your next device?</h2>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link href="/products/laptops" className="rounded-full bg-brand px-7 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-dark">
                Shop Laptops
              </Link>
              <Link href="/contact" className="rounded-full border border-white/25 px-7 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10">
                Contact Us
              </Link>
            </div>
          </div>
        </section>

        <PolicyStrip />
      </main>
      <Footer />
      <BulkEnquiryModal />
    </>
  );
}
