// SEO brand-landing content. Pure data (no imports) so it works on server
// (metadata, JSON-LD, generateStaticParams) and client.

const BRANDS = {
  dell: {
    displayName: "Dell",
    slug: "dell",
    tagline: "Enterprise-grade reliability at honest prices",
    heroDescription:
      "Dell laptops and desktops are trusted by enterprises, governments, and professionals worldwide. Refurbished Dell devices give you the same build quality, performance, and reliability at up to 60% less than new prices.",
    whyBuy: [
      { icon: "🏢", title: "Enterprise Grade", text: "Dell Latitude and OptiPlex are built for business — MIL-SPEC tested, durable, and designed for long-term use." },
      { icon: "🔧", title: "Easy to Service", text: "Dell devices are among the most serviceable laptops available — parts are widely available, making repairs fast and affordable." },
      { icon: "💼", title: "Business Features", text: "Fingerprint readers, IR cameras, Thunderbolt ports, and enterprise security features come standard on Dell Latitude series." },
      { icon: "💰", title: "Best Value", text: "Refurbished Dell laptops offer the best price-to-performance ratio in the market. Get a Dell Latitude for as low as ₹15,000." },
    ],
    popularModels: ["Dell Latitude 7420", "Dell Latitude 5420", "Dell Latitude 3420", "Dell OptiPlex 7080", "Dell OptiPlex 3080"],
    buyingGuide: [
      { budget: "Under ₹20,000", recommendation: "Dell Latitude 3420 or OptiPlex 3080 SFF", useCase: "Students, basic office work" },
      { budget: "₹20,000 – ₹35,000", recommendation: "Dell Latitude 5420 or 5480", useCase: "Professionals, business use" },
      { budget: "₹35,000+", recommendation: "Dell Latitude 7420 or XPS series", useCase: "Power users, developers" },
    ],
    faqs: [
      { q: "Are refurbished Dell laptops reliable?", a: "Yes. Dell laptops are built to enterprise standards and are among the most reliable refurbished devices available. Every device at RefurbishedKart is tested and comes with warranty." },
      { q: "What is the best refurbished Dell laptop to buy in India?", a: "The Dell Latitude 7420 (Core i7, 16GB RAM) offers the best combination of performance, build quality, and value. For budget buyers, the Latitude 3420 is excellent." },
      { q: "What warranty do I get on refurbished Dell laptops?", a: "All refurbished Dell laptops at RefurbishedKart come with warranty as mentioned on the product page. Check individual product pages for the exact warranty period." },
      { q: "Do refurbished Dell laptops come with Windows?", a: "Yes, most refurbished Dell laptops come with Windows 10 Pro or Windows 11 Pro pre-installed. Check individual product listings for OS details." },
    ],
    metaTitle: "Refurbished Dell Laptops & Desktops | Up to 60% Off | RefurbishedKart",
    metaDescription:
      "Buy certified refurbished Dell laptops and desktops in India. Dell Latitude, OptiPlex, XPS — tested, warrantied, GST invoice. Starting from ₹15,000. Free delivery.",
  },
  hp: {
    displayName: "HP",
    slug: "hp",
    tagline: "Professional performance, proven reliability",
    heroDescription:
      "HP laptops and desktops are trusted by professionals across India. The HP EliteBook and ProBook series offer enterprise-grade performance with premium build quality at refurbished prices.",
    whyBuy: [
      { icon: "⚡", title: "Wide Range", text: "HP offers the widest range of business laptops — from budget ProBook to premium EliteBook and ZBook workstations." },
      { icon: "🔒", title: "HP Sure Start Security", text: "HP EliteBook features HP Sure Start — self-healing BIOS that automatically recovers from cyberattacks." },
      { icon: "🏆", title: "Premium Build", text: "HP EliteBook laptops feature premium aluminium chassis, backlit keyboards, and military-grade durability standards." },
      { icon: "🖥️", title: "Best for SMEs", text: "HP ProDesk and EliteDesk desktops are the go-to choice for small and medium businesses across India." },
    ],
    popularModels: ["HP EliteBook 840 G8", "HP EliteBook 840 G6", "HP ProBook 450 G8", "HP EliteDesk 800 G5", "HP ProDesk 400 G6"],
    buyingGuide: [
      { budget: "Under ₹20,000", recommendation: "HP ProBook 450 G5 or ProDesk 400", useCase: "Students, budget office" },
      { budget: "₹20,000 – ₹35,000", recommendation: "HP EliteBook 840 G6", useCase: "Professionals, business" },
      { budget: "₹35,000+", recommendation: "HP EliteBook 840 G8 or ZBook", useCase: "Power users, designers" },
    ],
    faqs: [
      { q: "Are refurbished HP laptops worth buying?", a: "Absolutely. HP EliteBook and ProBook are enterprise-grade devices built to last. Refurbished HP laptops offer excellent value with the same performance at a fraction of the new price." },
      { q: "What is the best refurbished HP laptop in India?", a: "The HP EliteBook 840 G6 or G8 offers the best balance of performance, portability, and premium build quality. For budget buyers, the HP ProBook 450 series is excellent." },
      { q: "What warranty comes with refurbished HP laptops?", a: "Warranty details are mentioned on each product page. All HP laptops at RefurbishedKart are tested and certified before sale." },
      { q: "Do refurbished HP laptops come with charger?", a: "Check the individual product listing — the 'What's in the Box' section shows exactly what's included with each device." },
    ],
    metaTitle: "Refurbished HP Laptops & Desktops | EliteBook, ProBook | RefurbishedKart",
    metaDescription:
      "Buy certified refurbished HP laptops in India. EliteBook, ProBook, EliteDesk — tested, warrantied, GST invoice. Starting from ₹15,000. Free delivery across India.",
  },
  lenovo: {
    displayName: "Lenovo",
    slug: "lenovo",
    tagline: "ThinkPad — the world's most trusted business laptop",
    heroDescription:
      "Lenovo ThinkPad laptops are legendary for their durability, keyboard quality, and business features. Used by Fortune 500 companies and governments worldwide — now available as certified refurbished at RefurbishedKart.",
    whyBuy: [
      { icon: "⌨️", title: "Best Keyboard", text: "ThinkPad keyboards are consistently rated the best laptop keyboards available — deep travel, excellent feedback, perfect for all-day typing." },
      { icon: "🛡️", title: "MIL-SPEC Durability", text: "ThinkPad laptops pass 12 MIL-SPEC tests covering dust, humidity, vibration, and extreme temperatures." },
      { icon: "🔋", title: "Long Battery Life", text: "Lenovo ThinkPad T-series is known for excellent battery management and long-term battery health." },
      { icon: "🖥️", title: "Legendary Build Quality", text: "The ThinkPad carbon fibre and magnesium chassis has been trusted by businesses for over 30 years." },
    ],
    popularModels: ["Lenovo ThinkPad T14 Gen 1", "Lenovo ThinkPad T480", "Lenovo ThinkPad X1 Carbon", "Lenovo ThinkPad E14", "Lenovo ThinkCentre M70"],
    buyingGuide: [
      { budget: "Under ₹20,000", recommendation: "Lenovo ThinkPad E14 or ThinkCentre M70", useCase: "Students, basic business" },
      { budget: "₹20,000 – ₹35,000", recommendation: "Lenovo ThinkPad T480 or T14", useCase: "Professionals, developers" },
      { budget: "₹35,000+", recommendation: "Lenovo ThinkPad X1 Carbon", useCase: "Executives, power users" },
    ],
    faqs: [
      { q: "Why are ThinkPad laptops so popular?", a: "ThinkPad laptops are famous for their exceptional keyboard, MIL-SPEC durability, and business-focused features. They're the first choice for professionals who need a reliable workhorse." },
      { q: "Which is the best refurbished Lenovo ThinkPad to buy?", a: "The ThinkPad T14 Gen 1 (AMD or Intel) offers the best combination of modern specs, portability, and ThinkPad reliability. The T480 is excellent for budget buyers." },
      { q: "Are refurbished ThinkPad laptops durable?", a: "Yes — ThinkPad laptops are MIL-SPEC certified and among the most durable laptops ever made. A refurbished ThinkPad will easily last another 3-5 years." },
      { q: "Does Lenovo ThinkPad come with warranty at RefurbishedKart?", a: "Yes. Warranty details are mentioned on each product page. All ThinkPad devices are tested by our technical team before sale." },
    ],
    metaTitle: "Refurbished Lenovo ThinkPad Laptops | T14, T480, X1 Carbon | RefurbishedKart",
    metaDescription:
      "Buy certified refurbished Lenovo ThinkPad laptops in India. T14, T480, X1 Carbon — tested, warrantied, GST invoice. Starting from ₹18,000. Free delivery across India.",
  },
  apple: {
    displayName: "Apple",
    slug: "apple",
    tagline: "Premium Apple MacBooks at honest refurbished prices",
    heroDescription:
      "Apple MacBooks are the gold standard for build quality, performance, and longevity. Refurbished MacBooks at RefurbishedKart give you the premium Apple experience at significantly lower prices — all tested and certified.",
    whyBuy: [
      { icon: "⚡", title: "M-Series Performance", text: "Apple M1 and M2 chips deliver industry-leading performance and battery life — often outperforming Windows laptops costing twice as much." },
      { icon: "🏗️", title: "Premium Build", text: "MacBook aluminium unibody construction is among the most durable laptop designs ever made. A well-maintained MacBook lasts 7-10 years." },
      { icon: "🔋", title: "Exceptional Battery", text: "MacBook Air M1 delivers 18+ hours of battery life — no other laptop comes close at this price point." },
      { icon: "📈", title: "High Resale Value", text: "Apple MacBooks retain value better than any other laptop brand. A refurbished MacBook is also a smart investment." },
    ],
    popularModels: ["Apple MacBook Air M1", "Apple MacBook Air M2", "Apple MacBook Pro 13-inch", "Apple MacBook Pro 14-inch", "Apple Mac Mini M1"],
    buyingGuide: [
      { budget: "Under ₹50,000", recommendation: "MacBook Air M1 (8GB/256GB)", useCase: "Students, creative work, everyday use" },
      { budget: "₹50,000 – ₹80,000", recommendation: "MacBook Air M2 or MacBook Pro 13-inch M2", useCase: "Professionals, video editing, development" },
      { budget: "₹80,000+", recommendation: "MacBook Pro 14-inch M3", useCase: "Power users, video production" },
    ],
    faqs: [
      { q: "Are refurbished MacBooks worth buying?", a: "Yes — Apple MacBooks are among the best refurbished devices available. They're built to last, hold value well, and a refurbished MacBook from RefurbishedKart comes tested and certified." },
      { q: "What is the best refurbished MacBook to buy in India?", a: "The MacBook Air M1 offers the best value — exceptional performance, 18-hour battery, and premium build at an accessible price point." },
      { q: "Do refurbished MacBooks come with warranty?", a: "Yes. Warranty details are mentioned on each product page. All MacBooks are tested by our technical team before sale." },
      { q: "Can I get GST invoice for refurbished MacBook?", a: "Yes — RefurbishedKart provides GST invoices on all purchases, including MacBooks." },
    ],
    metaTitle: "Refurbished Apple MacBook Laptops | MacBook Air M1, M2 | RefurbishedKart",
    metaDescription:
      "Buy certified refurbished Apple MacBook Air and MacBook Pro in India. M1, M2 chips — tested, warrantied, GST invoice. Free delivery across India.",
  },
};

export default BRANDS;
export const getBrand = (slug) => BRANDS[String(slug || "").toLowerCase()] || null;
export const getAllBrandSlugs = () => Object.keys(BRANDS);
