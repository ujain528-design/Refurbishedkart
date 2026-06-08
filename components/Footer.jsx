import Link from "next/link";
import { FOOTER_COLS } from "@/lib/data";
import NewsletterForm from "@/components/NewsletterForm";
import { LogoMark } from "@/components/Icons";

/* Map footer link labels to routes. Unmapped labels stay as "#" placeholders. */
const ROUTE_MAP = {
  Laptops: "/products/laptops", Desktops: "/products/desktops", Monitors: "/products/monitors",
  Servers: "/products/servers", Workstations: "/products/workstations",
  "About Us": "/about", About: "/about", "Contact Us": "/contact", Contact: "/contact",
  "Returns & Refunds": "/return-policy", "Return Policy": "/return-policy",
  "Warranty Claim": "/warranty", Warranty: "/warranty",
  "Privacy Policy": "/privacy-policy", "Terms of Service": "/terms", Terms: "/terms",
};
const hrefFor = (label) => ROUTE_MAP[label] || "#";

export default function Footer() {
  return (
    <footer className="bg-[#111] text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Newsletter — PRD §4.1 */}
        <div className="mb-14 flex flex-wrap items-center justify-between gap-6 border-b border-white/10 pb-12">
          <div>
            <p className="text-lg font-bold">Deals drop fast. Stock drops faster.</p>
            <p className="mt-1 text-sm text-white/50">
              One email a week with the best refurbished arrivals. No spam.
            </p>
          </div>
          <NewsletterForm />
        </div>

        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          {/* Brand blurb */}
          <div>
            <p className="flex items-center gap-2.5 text-lg font-extrabold uppercase tracking-wide">
              <LogoMark className="h-8 w-8 text-brand-accent" />
              <span>
                Refurbished <span className="text-brand-accent">Kart</span>
              </span>
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/50">
              Certified refurbished laptops, desktops and enterprise hardware —
              tested, warrantied and delivered across India.
            </p>
            <p className="mt-6 text-sm text-white/50">
              support@refurbishedkart.com
              <br />
              +91 98765 43210
            </p>
            <p className="mt-4 text-xs text-white/35">
              MMT Global Recycling Pvt. Ltd. · GSTIN: 00AAAAA0000A1Z0
            </p>
          </div>

          {FOOTER_COLS.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-bold uppercase tracking-wider text-white/80">
                {col.title}
              </p>
              <ul className="mt-5 space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <Link
                      href={hrefFor(link)}
                      className="text-sm text-white/55 transition-colors duration-200 hover:text-brand-accent"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-7">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} RefurbishedKart. All rights reserved.
          </p>
          <div className="flex gap-6">
            {["Privacy Policy", "Terms of Service", "Contact"].map((l) => (
              <Link
                key={l}
                href={hrefFor(l)}
                className="text-xs text-white/40 transition-colors duration-200 hover:text-brand-accent"
              >
                {l}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
