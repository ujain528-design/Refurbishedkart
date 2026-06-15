"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FOOTER_COLS } from "@/lib/data";
import NewsletterForm from "@/components/NewsletterForm";
import { LogoMark } from "@/components/Icons";
import { getFooterInfo } from "@/lib/api";
import { paletteAt } from "@/lib/categoryColors";

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

const FALLBACK_INFO = { email: "support@refurbishedkart.com", phone: "+91 98765 43210", gstin: "00AAAAA0000A1Z0" };

export default function Footer() {
  const [info, setInfo] = useState(FALLBACK_INFO);
  useEffect(() => { getFooterInfo().then((i) => i && setInfo({ ...FALLBACK_INFO, ...i })).catch(() => {}); }, []);
  return (
    <footer className="bg-dark text-white">
      <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8 lg:py-16">
        {/* Newsletter — PRD §4.1 */}
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-7 lg:mb-14 lg:gap-6 lg:pb-12">
          <div>
            <p className="text-base font-bold lg:text-lg">Deals drop fast. Stock drops faster.</p>
            <p className="mt-1 text-[0.8rem] text-white/50 lg:text-sm">
              One email a week with the best refurbished arrivals. No spam.
            </p>
          </div>
          <NewsletterForm />
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-7 md:grid-cols-[1.4fr_repeat(4,1fr)] lg:gap-12">
          {/* Brand blurb — full width on mobile, first column on desktop */}
          <div className="col-span-2 md:col-span-1">
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
              {info.email}
              <br />
              {info.phone}
            </p>
            <p className="mt-4 text-xs text-white/35">
              GSTIN: {info.gstin}
            </p>
          </div>

          {FOOTER_COLS.map((col) => (
            <div key={col.title}>
              <p className="text-[0.8rem] font-bold uppercase tracking-wider text-white/80 lg:text-sm">
                {col.title}
              </p>
              <ul className="mt-3 space-y-2 lg:mt-5 lg:space-y-3">
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

        <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5 lg:mt-14 lg:pt-7">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} RefurbishedKart. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {/* Social links — only render the ones with a URL set in Settings → Social */}
            {Object.entries(info.social || {}).filter(([, url]) => url).map(([name, url], i) => (
              <a key={name} href={url} target="_blank" rel="noopener noreferrer" className="soc-hover text-xs text-white/40 transition-colors duration-200" style={{ "--sc": paletteAt(i).color }}>
                {name}
              </a>
            ))}
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
