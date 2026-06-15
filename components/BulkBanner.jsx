import BulkEnquiryTrigger from "@/components/BulkEnquiryTrigger";

export default function BulkBanner() {
  return (
    <section id="bulk-enquiry" className="py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-card bg-brand px-5 py-8 text-center lg:px-8 lg:py-16">
          {/* subtle decorative rings */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full border-[28px] border-white/5"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full border-[32px] border-white/5"
          />
          <h2 className="relative text-xl font-extrabold tracking-tight text-white lg:text-3xl">
            Need 5+ units? Get a custom quote.
          </h2>
          <p className="relative mx-auto mt-3 max-w-lg text-sm text-white/80 md:text-base">
            Volume pricing, GST billing and a dedicated account manager for
            offices, schools and startups.
          </p>
          {/* PRD §4.2: banner is an entry point — opens the modal with both options */}
          <div className="relative mt-8 flex justify-center">
            <BulkEnquiryTrigger className="rounded-full bg-white px-8 py-3.5 text-sm font-bold text-brand transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover">
              Get a Custom Quote
            </BulkEnquiryTrigger>
          </div>
        </div>
      </div>
    </section>
  );
}
