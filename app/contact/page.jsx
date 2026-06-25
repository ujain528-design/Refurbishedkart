import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PolicyStrip from "@/components/PolicyStrip";
import BulkEnquiryModal from "@/components/BulkEnquiryModal";
import BulkEnquiryTrigger from "@/components/BulkEnquiryTrigger";
import ContactForm from "@/components/contact/ContactForm";

export const metadata = {
  title: "Contact Us | RefurbishedKart",
  description:
    "Get in touch with RefurbishedKart. Call, WhatsApp, or email us. Visit our store in Patparganj, Delhi. Mon–Sat 11AM–6PM.",
  alternates: { canonical: "https://refurbishedkart.com/contact" },
};

const PHONE = "+91 8448296273";
const WHATSAPP = "https://wa.me/918448296273";
const EMAIL = "support@refurbishedkart.com";
const HOURS = "Monday to Saturday, 11:00 AM – 6:00 PM";

const CARDS = [
  { icon: "📞", title: "Call Us", lines: [PHONE, HOURS], href: "tel:+918448296273" },
  { icon: "💬", title: "WhatsApp", lines: [PHONE, "Chat with us on WhatsApp"], href: WHATSAPP },
  { icon: "📧", title: "Email", lines: [EMAIL, "We respond within 24 hours"], href: `mailto:${EMAIL}` },
  { icon: "📍", title: "Visit Us", lines: ["147, Patparganj Industrial Area,", "Near Anand Vihar, Delhi – 110092", HOURS] },
];

// Google Maps embed for the Patparganj, Delhi location.
const MAP_SRC =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7003.290840344736!2d77.31005541077369!3d28.64038737555886!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cfb49f6185237%3A0xe7b49e16f52bc646!2sResource%20E%20Waste%20Solution%20Pvt%20Ltd!5e0!3m2!1sen!2sin!4v1782372571795!5m2!1sen!2sin";

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main>
        {/* 1 — Header */}
        <section className="border-b border-black/5 bg-offwhite">
          <div className="mx-auto max-w-4xl px-4 py-10 text-center sm:px-6 lg:py-14">
            <h1 className="text-2xl font-extrabold tracking-tight text-ink lg:text-4xl">Contact Us</h1>
            <p className="mt-3 text-[13px] text-neutral-500 lg:text-[15px]">We&apos;re here to help. Reach us via call, WhatsApp, or email.</p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
          {/* 2 — Contact detail cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {CARDS.map((c) => {
              const inner = (
                <div className="h-full rounded-card border border-black/5 bg-white p-5 shadow-card transition-colors hover:border-brand/30">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-xl">{c.icon}</span>
                  <h2 className="mt-4 text-sm font-bold text-ink">{c.title}</h2>
                  <div className="mt-1.5 space-y-0.5 text-[13px] leading-relaxed text-neutral-500">
                    {c.lines.map((l, i) => (
                      <p key={i} className={i === 0 ? "font-semibold text-ink" : ""}>{l}</p>
                    ))}
                  </div>
                </div>
              );
              return c.href ? (
                <a key={c.title} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined} className="block">
                  {inner}
                </a>
              ) : (
                <div key={c.title}>{inner}</div>
              );
            })}
          </div>

          {/* 3 — Bulk / B2B */}
          <div className="mt-8 rounded-card border-2 border-brand/20 bg-brand-softer/40 p-6 lg:mt-12 lg:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <h2 className="text-lg font-bold text-ink lg:text-xl">Bulk &amp; B2B Orders</h2>
                <p className="mt-2 text-[13px] leading-relaxed text-neutral-600 lg:text-sm">
                  Looking to order in bulk for your office, school, or business? Our B2B team is ready to help with custom quotes, GST invoices, and dedicated support.
                </p>
                <p className="mt-3 text-sm font-semibold text-ink">
                  📞 B2B Helpline: <a href="tel:+917665753755" className="text-brand hover:underline">+91 7665753755</a>
                </p>
              </div>
              <BulkEnquiryTrigger className="shrink-0 rounded-full bg-brand px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-dark">
                Submit Bulk Enquiry
              </BulkEnquiryTrigger>
            </div>
          </div>

          {/* 4 + 5 — Form + Map */}
          <div className="mt-10 grid gap-8 lg:mt-14 lg:grid-cols-2 lg:gap-12">
            <div>
              <h2 className="text-lg font-bold text-ink lg:text-xl">Send us a Message</h2>
              <div className="mt-5"><ContactForm /></div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink lg:text-xl">Find Us</h2>
              <div className="mt-5 overflow-hidden rounded-card border border-black/5 shadow-card">
                <iframe
                  src={MAP_SRC}
                  width="100%"
                  height="400"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  title="RefurbishedKart / Resource E Waste Solutions Location"
                />
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-neutral-500">
                147, Patparganj Industrial Area, Near Anand Vihar, Delhi – 110092
              </p>
            </div>
          </div>
        </div>

        <PolicyStrip />
      </main>
      <Footer />
      <BulkEnquiryModal />
    </>
  );
}
