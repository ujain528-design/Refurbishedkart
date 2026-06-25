// SEO price-bucket landing content. Pure data (no imports) so it runs on server
// (metadata, JSON-LD, generateStaticParams) and client. "[CATEGORY]" in headings/
// descriptions is replaced with the actual category plural at render time.

export const PRICE_BUCKETS = {
  "under-20000": {
    label: "Under ₹20,000",
    slug: "under-20000",
    minPrice: 0,
    maxPrice: 19999,
    heading: "Refurbished [CATEGORY] Under ₹20,000",
    tagline: "Quality technology that fits every budget",
    description:
      "Looking for a reliable [CATEGORY] under ₹20,000? RefurbishedKart offers certified refurbished devices starting from ₹15,000 — tested, warrantied, and delivered across India.",
    tip: "In this budget, look for 6th–8th Gen Core i5, 8GB RAM, and an SSD (not HDD) for the best everyday performance.",
    faqs: [
      { q: "Can I get a good refurbished laptop under ₹20,000?", a: "Yes. RefurbishedKart offers certified refurbished laptops under ₹20,000 from brands like Dell, HP, and Lenovo. These are enterprise-grade devices tested by our technical team and backed by warranty." },
      { q: "What specs can I expect under ₹20,000?", a: "Typically Core i5 6th-8th Gen, 8GB RAM, 256GB SSD — more than enough for office work, studying, and everyday use." },
      { q: "Is it safe to buy refurbished under ₹20,000?", a: "Yes — all devices at RefurbishedKart are tested, certified, and come with warranty regardless of price." },
    ],
  },
  "20000-35000": {
    label: "₹20,000 – ₹35,000",
    slug: "20000-35000",
    minPrice: 20000,
    maxPrice: 35000,
    heading: "Refurbished [CATEGORY] ₹20,000 – ₹35,000",
    tagline: "The sweet spot — premium performance at honest prices",
    description:
      "The ₹20,000–₹35,000 range is the sweet spot for refurbished laptops in India. Get 10th-11th Gen processors, 16GB RAM, and SSD storage — everything you need for professional work.",
    tip: "Aim for 10th–11th Gen Core i5/i7, 8–16GB RAM, and a 256GB+ SSD — the sweet spot for professional work.",
    faqs: [
      { q: "What is the best refurbished laptop between ₹20,000 and ₹35,000?", a: "The Dell Latitude 5420 and HP EliteBook 840 G6 are excellent choices in this range — Core i5/i7, 8-16GB RAM, SSD, business-grade build quality." },
      { q: "Is ₹25,000 a good budget for a refurbished laptop?", a: "Yes — ₹25,000 gets you a solid 10th Gen Core i5 laptop with 8GB RAM and 256GB SSD from a brand like Dell or HP. More than enough for most professional use cases." },
      { q: "What brands are available between ₹20,000-₹35,000?", a: "Dell Latitude, HP EliteBook, Lenovo ThinkPad T-series are all available in this range at RefurbishedKart." },
    ],
  },
  "35000-50000": {
    label: "₹35,000 – ₹50,000",
    slug: "35000-50000",
    minPrice: 35000,
    maxPrice: 50000,
    heading: "Refurbished [CATEGORY] ₹35,000 – ₹50,000",
    tagline: "Premium refurbished — flagship performance, smart price",
    description:
      "The ₹35,000–₹50,000 range delivers flagship-level refurbished laptops. Expect 11th-12th Gen Core i7, 16GB RAM, 512GB SSD, and premium build quality from Dell, HP, Lenovo, and Apple.",
    tip: "Look for 11th–12th Gen Core i7, 16GB RAM, and 512GB SSD — or a MacBook Air M1 for premium value.",
    faqs: [
      { q: "What refurbished laptop can I get for ₹40,000?", a: "At ₹40,000 you can get a Dell Latitude 7420 (Core i7, 16GB RAM) or HP EliteBook 840 G8 — both premium business laptops with excellent build quality and performance." },
      { q: "Is a refurbished laptop at ₹45,000 worth it?", a: "Absolutely. At this price point you're getting a device that was originally priced at ₹80,000–₹1,20,000 new. The value proposition is exceptional." },
      { q: "Can I get a MacBook under ₹50,000?", a: "Yes — refurbished MacBook Air models are available around ₹45,000–₹50,000 at RefurbishedKart." },
    ],
  },
  "above-50000": {
    label: "Above ₹50,000",
    slug: "above-50000",
    minPrice: 50000,
    maxPrice: 999999,
    heading: "Premium Refurbished [CATEGORY] Above ₹50,000",
    tagline: "The best refurbished devices — uncompromised",
    description:
      "For those who want the absolute best — premium refurbished laptops above ₹50,000. MacBook Air M1/M2, ThinkPad X1 Carbon, Dell XPS — flagship devices at significantly lower than new prices.",
    tip: "Prioritise the latest silicon (Apple M1/M2 or 12th Gen+), 16GB+ RAM, and a 512GB+ SSD for flagship performance.",
    faqs: [
      { q: "What premium refurbished laptops are available above ₹50,000?", a: "MacBook Air M1/M2, Lenovo ThinkPad X1 Carbon, Dell XPS, and HP ZBook are available above ₹50,000 at RefurbishedKart." },
      { q: "Is a refurbished laptop above ₹50,000 worth buying?", a: "Yes — these are flagship devices originally priced at ₹1,00,000–₹2,00,000 new. You save 50-60% while getting the same premium performance and build quality." },
      { q: "Do premium refurbished laptops come with warranty?", a: "Yes — all devices at RefurbishedKart come with warranty regardless of price. Check the product page for specific warranty period." },
    ],
  },
};

export const CATEGORIES = {
  laptops: { label: "Laptops", plural: "Laptops", icon: "💻" },
  desktops: { label: "Desktop", plural: "Desktops", icon: "🖥️" },
  monitors: { label: "Monitor", plural: "Monitors", icon: "🖥️" },
  servers: { label: "Server", plural: "Servers", icon: "🖧" },
  workstations: { label: "Workstation", plural: "Workstations", icon: "💻" },
};

export const getPriceBucket = (slug) => PRICE_BUCKETS[slug] || null;
export const getAllBucketSlugs = () => Object.keys(PRICE_BUCKETS);
export const getCategoryMeta = (slug) => CATEGORIES[String(slug || "").toLowerCase()] || null;
export const getAllBudgetCategorySlugs = () => Object.keys(CATEGORIES);
