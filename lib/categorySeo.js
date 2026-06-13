// Per-category SEO copy for the listing pages: keyword intro + FAQ (used for the
// on-page accordion AND the FAQPage JSON-LD). Pure data, importable anywhere.

export const CATEGORY_INTRO = {
  laptops:
    "Buy certified refurbished laptops in India at the best prices. All laptops are tested, cleaned and come with GST invoice, warranty and 7-day returns.",
  desktops:
    "Shop refurbished desktop computers in India. Certified refurbished PCs with warranty, GST invoice and free delivery.",
  monitors:
    "Buy refurbished monitors in India at unbeatable prices. All monitors tested for dead pixels, brightness and ports.",
  servers:
    "Certified refurbished servers in India for businesses. Dell, HP, IBM servers tested and ready to deploy.",
  workstations:
    "Refurbished workstations in India for professionals. High-performance certified workstations at best prices.",
};

export const categoryIntro = (slug) =>
  CATEGORY_INTRO[slug] ||
  `Buy certified refurbished ${slug} in India with warranty, GST invoice and 7-day returns.`;

// Laptops uses the exact spec'd copy. Other categories get an accurate generic
// set (we don't claim, e.g., that monitors ship with Windows).
const LAPTOP_FAQ = [
  { q: "Are refurbished laptops reliable?", a: "Yes. Our laptops go through a 14-point inspection, performance benchmarking, and come with a warranty." },
  { q: "What warranty do refurbished laptops come with?", a: "All laptops come with a minimum 3-month warranty. Many carry 6-month or 1-year warranty." },
  { q: "Do refurbished laptops come with Windows?", a: "Yes. Most laptops come with genuine Windows 10 Pro or Windows 11 Pro pre-installed." },
  { q: "Is a GST invoice available?", a: "Yes. Every purchase includes a GST tax invoice." },
  { q: "What is the return policy?", a: "We offer a 7-day return policy on all refurbished laptops." },
];

function genericFaq(noun) {
  const one = noun.replace(/s$/, "");
  return [
    { q: `Are refurbished ${noun} reliable?`, a: `Yes. Every ${one} is inspected and cleaned before listing, and comes with a warranty.` },
    { q: `What warranty do refurbished ${noun} come with?`, a: `All ${noun} come with a minimum 3-month warranty. Many carry 6-month or 1-year warranty.` },
    { q: "Is a GST invoice available?", a: "Yes. Every purchase includes a GST tax invoice." },
    { q: "What is the return policy?", a: `We offer a 7-day return policy on all refurbished ${noun}.` },
    { q: "Do you deliver across India?", a: "Yes. We offer free, fully-insured delivery across India." },
  ];
}

const NOUN = { laptops: "laptops", desktops: "desktops", monitors: "monitors", servers: "servers", workstations: "workstations" };

export function categoryFaq(slug) {
  return slug === "laptops" ? LAPTOP_FAQ : genericFaq(NOUN[slug] || "products");
}
