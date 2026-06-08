import StaticPage, { H2 } from "@/components/StaticPage";
import ContactForm from "@/components/contact/ContactForm";

export const metadata = { title: "Contact Us — RefurbishedKart" };

export default function ContactPage() {
  return (
    <StaticPage title="Contact Us" subtitle="Questions about an order, a product, or a bulk enquiry? We're here." wide>
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <H2>Reach us</H2>
          <dl className="mt-4 space-y-4 text-sm">
            <div><dt className="text-[12px] font-semibold uppercase tracking-wide text-neutral-400">Address</dt><dd className="mt-0.5 text-neutral-600">MMT Global Recycling Pvt. Ltd.<br />402, Brigade Gateway, Rajajinagar,<br />Bengaluru, Karnataka — 560055</dd></div>
            <div><dt className="text-[12px] font-semibold uppercase tracking-wide text-neutral-400">Phone</dt><dd className="mt-0.5 font-semibold text-ink">+91 98765 43210</dd></div>
            <div><dt className="text-[12px] font-semibold uppercase tracking-wide text-neutral-400">Email</dt><dd className="mt-0.5 font-semibold text-ink">support@refurbishedkart.com</dd></div>
            <div><dt className="text-[12px] font-semibold uppercase tracking-wide text-neutral-400">Business hours</dt><dd className="mt-0.5 text-neutral-600">Mon–Sat, 10:00 AM – 7:00 PM IST</dd></div>
          </dl>

          {/* map placeholder */}
          <div className="mt-6 flex h-44 items-center justify-center rounded-card border border-black/5 bg-neutral-100 text-sm font-semibold text-neutral-400">
            Our Location
          </div>
        </div>

        <div>
          <H2>Send a message</H2>
          <div className="mt-4">
            <ContactForm />
          </div>
        </div>
      </div>
    </StaticPage>
  );
}
