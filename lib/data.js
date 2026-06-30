// ── Mock data only. No backend. Replace with API calls later. ──

export const NAV_CATEGORIES = [
  {
    name: "Laptops",
    brands: ["Dell", "HP", "Lenovo", "Apple", "Asus", "Acer", "MSI", "Microsoft"],
  },
  {
    name: "Desktops",
    brands: ["Dell", "HP", "Lenovo", "Apple", "Acer", "Zebronics", "Custom Build", "Intel NUC"],
  },
  {
    name: "Monitors",
    brands: ["Dell", "HP", "LG", "Samsung", "BenQ", "Acer", "ViewSonic", "AOC"],
  },
  {
    name: "Servers",
    brands: ["Dell EMC", "HPE", "Lenovo", "IBM", "Supermicro", "Cisco", "Fujitsu", "Oracle"],
  },
  {
    name: "Workstations",
    brands: ["Dell Precision", "HP Z Series", "Lenovo ThinkStation", "Apple Mac Studio", "Asus ProArt", "MSI", "Boxx", "Puget"],
  },
];

// Per PRD §4.1: Tested & Certified | 7-Day Returns | GST Invoice | PAN India Delivery
export const TRUST_BADGES = [
  "Tested & Certified",
  "7-Day Returns",
  "GST Invoice",
  "PAN India Delivery",
];

export const REFURB_STEPS = [
  { label: "Sourced & Assessed", icon: "device" },
  { label: "Deep Inspection", icon: "inspect" },
  { label: "Cleaned & Restored", icon: "clean" },
  { label: "Certified & Shipped", icon: "certified" },
];

/* ─────────────────────────────────────────────────────────────────
   SINGLE TAGGED PRODUCT POOL — PRD §4.1: homepage rows are tag-driven,
   not separate listings. To put a model in a section, add the tag to
   its `tags` array. One product can carry any number of tags.

   Available tags:  "bestseller" | "flash-sale" | "student" | "new-arrival"
   (Adding a brand-new tag = creating a custom row, same as the PRD's
   admin-defined rows. Add the tag here, render a <ProductRow> with it.)

   `badge` is an optional label shown on the card (e.g. "New").
   Flash-sale products automatically get the red %-OFF badge instead.
   ───────────────────────────────────────────────────────────────── */

/* `extra` = { stock, ...filterable attributes }. Attribute keys:
   processor | gen | ram | ramType | ssd | screen | gpu | os | warranty
   stock: 0 = out of stock, 1–5 = low stock ("Only X left"). */
const product = (id, name, specs, price, mrp, brand, category, tags = [], badge, extra = {}) => {
  /* RAM listing options:
     onboardRam: <GB number> — this much RAM is onboard/soldered. Base price
                 includes it; tiers below it are never offered.
     ramExpandable: true/false — onboard models with a free slot can still be
                 upgraded above the onboard amount. Defaults: explicitly set
                 onboardRam → expandable; LPDDR ramType → onboard at installed
                 size and NOT expandable (both overridable per product).
     onboardSsd / ssdExpandable — same scheme for storage. Apple Silicon
                 models auto-fix SSD at installed capacity (soldered). */
  /* touchscreen: fixed per listing, set by admin — never a selectable variant.
     A model sold in touch AND non-touch versions gets TWO separate listings. */
  const { stock = 10, image, images, onboardRam = null, ramExpandable = null, ...attrs } = extra;
  if (category === "Laptops" && attrs.touchscreen === undefined) attrs.touchscreen = false;
  return {
    id,
    name,
    specs,
    price,
    mrp,
    brand,
    category,
    tags,
    badge,
    stock,
    image, // card thumbnail — falls back to placeholder when absent
    images: images ?? (image ? [image] : []), // PDP gallery
    onboardRam,
    ramExpandable,
    attrs,
    flashSale: tags.includes("flash-sale"),
  };
};

export const ALL_PRODUCTS = [
  // ── laptops ──
  product(1, "Dell Latitude 7420", 'i7 11th Gen · 16GB · 512GB SSD · 14" FHD', 38999, 92000, "Dell", "Laptops", ["bestseller"], undefined,
    { processor: "Intel i7", gen: "11th Gen", ram: 16, ramType: "DDR4", ssd: "512GB", screen: '14"', gpu: "Integrated", os: "Windows 11 Pro", warranty: "1 Year", stock: 14 }),
  product(2, "Lenovo ThinkPad T14", 'i5 10th Gen · 16GB · 256GB SSD · 14" FHD', 27499, 78000, "Lenovo", "Laptops", ["bestseller"], undefined,
    { processor: "Intel i5", gen: "10th Gen", ram: 16, ramType: "DDR4", ssd: "256GB", screen: '14"', gpu: "Integrated", os: "Windows 11 Pro", warranty: "1 Year", stock: 9, onboardRam: 16, ramExpandable: true, image: "/products/thinkpad-a.avif",
      images: ["/products/thinkpad-a.avif", "/products/thinkpad-e.avif", "/products/thinkpad-c.avif", "/products/thinkpad-d.avif"] }),
  product(3, "Apple MacBook Air M1", '8GB · 256GB SSD · 13.3" Retina', 47999, 92900, "Apple", "Laptops", ["bestseller"], undefined,
    { processor: "Apple M1", gen: "Apple M1", ram: 8, ramType: "LPDDR4X", ssd: "256GB", screen: '13.3"', gpu: "Apple 7-core", os: "macOS", warranty: "6 Months", stock: 4 }),
  product(4, "HP EliteBook 840 G8", 'i5 11th Gen · 16GB · 512GB SSD · 14" FHD', 32999, 85000, "HP", "Laptops", ["bestseller"], undefined,
    { processor: "Intel i5", gen: "11th Gen", ram: 16, ramType: "DDR4", ssd: "512GB", screen: '14"', gpu: "Integrated", os: "Windows 11 Pro", warranty: "1 Year", stock: 11 }),
  product(11, "Lenovo ThinkPad X1 Carbon G8", 'i7 10th Gen · 16GB · 512GB SSD · 14"', 41999, 145000, "Lenovo", "Laptops", ["flash-sale"], undefined,
    { processor: "Intel i7", gen: "10th Gen", ram: 16, ramType: "LPDDR3", ssd: "512GB", screen: '14"', gpu: "Integrated", os: "Windows 11 Pro", warranty: "6 Months", stock: 3, image: "/products/thinkpad-e.avif",
      images: ["/products/thinkpad-e.avif", "/products/thinkpad-b.avif"] }),
  product(13, "Dell Latitude 5410", 'i5 10th Gen · 8GB · 256GB SSD · 14" FHD', 21999, 72000, "Dell", "Laptops", ["flash-sale"], undefined,
    { processor: "Intel i5", gen: "10th Gen", ram: 8, ramType: "DDR4", ssd: "256GB", screen: '14"', gpu: "Integrated", os: "Windows 10 Pro", warranty: "6 Months", stock: 18 }),
  product(21, "Lenovo ThinkPad L480", 'i5 8th Gen · 8GB · 256GB SSD · 14"', 17999, 62000, "Lenovo", "Laptops", ["student"], undefined,
    { processor: "Intel i5", gen: "8th Gen", ram: 8, ramType: "DDR4", ssd: "256GB", screen: '14"', gpu: "Integrated", os: "Windows 10 Pro", warranty: "6 Months", stock: 0 }),
  product(22, "Dell Latitude 3400", 'i3 8th Gen · 8GB · 256GB SSD · 14"', 14499, 48000, "Dell", "Laptops", ["student"], undefined,
    { processor: "Intel i3", gen: "8th Gen", ram: 8, ramType: "DDR4", ssd: "256GB", screen: '14"', gpu: "Integrated", os: "Windows 10 Pro", warranty: "6 Months", stock: 22 }),
  product(23, "HP EliteBook 830 G5", 'i5 8th Gen · 8GB · 256GB SSD · 13.3" FHD', 18999, 68000, "HP", "Laptops", ["student"], undefined,
    { processor: "Intel i5", gen: "8th Gen", ram: 8, ramType: "DDR4", ssd: "256GB", screen: '13.3"', gpu: "Integrated", os: "Windows 10 Pro", warranty: "6 Months", stock: 7 }),
  product(24, "Apple MacBook Air 2017", 'i5 · 8GB · 128GB SSD · 13.3"', 24999, 67000, "Apple", "Laptops", ["student"], undefined,
    { processor: "Intel i5", gen: "7th Gen", ram: 8, ramType: "LPDDR3", ssd: "128GB", screen: '13.3"', gpu: "Integrated", os: "macOS", warranty: "6 Months", stock: 5 }),
  product(25, "Asus VivoBook 14", 'Ryzen 5 · 8GB · 512GB SSD · 14" FHD', 19999, 45000, "Asus", "Laptops", ["student"], undefined,
    { processor: "AMD Ryzen 5", gen: "Ryzen 4000", ram: 8, ramType: "DDR4", ssd: "512GB", screen: '14"', gpu: "Integrated", os: "Windows 11 Home", warranty: "6 Months", stock: 13 }),
  product(31, "Dell Latitude 7430", 'i7 12th Gen · 16GB · 512GB SSD · 14" FHD', 52999, 125000, "Dell", "Laptops", ["new-arrival"], "New",
    { processor: "Intel i7", gen: "12th Gen", ram: 16, ramType: "DDR4", ssd: "512GB", screen: '14"', gpu: "Integrated", os: "Windows 11 Pro", warranty: "1 Year", stock: 8 }),
  product(32, "HP EliteBook 845 G9", 'Ryzen 7 PRO · 16GB · 512GB SSD · 14" WUXGA', 44999, 110000, "HP", "Laptops", ["new-arrival"], "New",
    { processor: "AMD Ryzen 7", gen: "Ryzen 6000", ram: 16, ramType: "DDR5", ssd: "512GB", screen: '14"', gpu: "Integrated", os: "Windows 11 Pro", warranty: "1 Year", stock: 6 }),
  product(34, "Apple MacBook Pro 2020 M1", '8GB · 256GB SSD · 13.3" Retina · Touch Bar', 58999, 122900, "Apple", "Laptops", ["new-arrival"], "New",
    { processor: "Apple M1", gen: "Apple M1", ram: 8, ramType: "LPDDR4X", ssd: "256GB", screen: '13.3"', gpu: "Apple 8-core", os: "macOS", warranty: "1 Year", stock: 2 }),
  // catalogue-only laptops (no homepage tag — visible on listing page only)
  product(101, "Dell XPS 13 9310", 'i7 11th Gen · 16GB · 512GB SSD · 13.4" FHD+', 54999, 131000, "Dell", "Laptops", [], undefined,
    { processor: "Intel i7", gen: "11th Gen", ram: 16, ramType: "LPDDR4X", ssd: "512GB", screen: '13.4"', gpu: "Integrated", os: "Windows 11 Pro", warranty: "1 Year", stock: 5 }),
  product(102, "HP ZBook Firefly 14 G8", "i7 11th Gen · 32GB · 1TB SSD · NVIDIA T500", 62999, 175000, "HP", "Laptops", [], undefined,
    { processor: "Intel i7", gen: "11th Gen", ram: 32, ramType: "DDR4", ssd: "1TB", screen: '14"', gpu: "NVIDIA T500", os: "Windows 11 Pro", warranty: "1 Year", stock: 7 }),
  product(103, "Lenovo ThinkPad E15", 'i5 10th Gen · 16GB · 512GB SSD · 15.6" FHD', 23999, 68000, "Lenovo", "Laptops", [], undefined,
    { processor: "Intel i5", gen: "10th Gen", ram: 16, ramType: "DDR4", ssd: "512GB", screen: '15.6"', gpu: "Integrated", os: "Windows 11 Home", warranty: "6 Months", stock: 16 }),
  product(104, "Acer Aspire 5", 'i5 11th Gen · 8GB · 512GB SSD · MX450 · 15.6"', 21999, 56000, "Acer", "Laptops", [], undefined,
    { processor: "Intel i5", gen: "11th Gen", ram: 8, ramType: "DDR4", ssd: "512GB", screen: '15.6"', gpu: "NVIDIA MX450", os: "Windows 11 Home", warranty: "6 Months", stock: 0 }),
  product(105, "Microsoft Surface Laptop 3", 'i5 10th Gen · 8GB · 256GB SSD · 13.5" Touch', 28999, 99000, "Microsoft", "Laptops", [], undefined,
    { processor: "Intel i5", gen: "10th Gen", ram: 8, ramType: "LPDDR4X", ssd: "256GB", screen: '13.5"', gpu: "Integrated", os: "Windows 11 Pro", warranty: "6 Months", stock: 9, touchscreen: true }),
  product(106, "MSI Modern 14", 'Ryzen 5 · 16GB · 512GB SSD · 14" FHD', 25999, 62000, "MSI", "Laptops", [], undefined,
    { processor: "AMD Ryzen 5", gen: "Ryzen 5000", ram: 16, ramType: "DDR4", ssd: "512GB", screen: '14"', gpu: "Integrated", os: "Windows 11 Home", warranty: "6 Months", stock: 12 }),
  // touch + non-touch versions of the same model = two separate listings (see id 31)
  product(107, "Dell Latitude 7430 (Touch)", 'i7 12th Gen · 16GB · 512GB SSD · 14" FHD Touch', 56999, 132000, "Dell", "Laptops", [], undefined,
    { processor: "Intel i7", gen: "12th Gen", ram: 16, ramType: "DDR4", ssd: "512GB", screen: '14"', gpu: "Integrated", os: "Windows 11 Pro", warranty: "1 Year", stock: 6, touchscreen: true }),

  // ── desktops (formFactor: SFF | Mini | Tower | All-in-One) ──
  product(5, "Dell OptiPlex 7080 SFF", "i7 10th Gen · 16GB · 512GB SSD · Win 11 Pro", 24999, 65000, "Dell", "Desktops", ["bestseller"], undefined,
    { processor: "Intel i7", gen: "10th Gen", ram: 16, ramType: "DDR4", ssd: "512GB", os: "Windows 11 Pro", warranty: "1 Year", stock: 10, formFactor: "SFF" }),
  product(12, "HP ProDesk 600 G6 Mini", "i5 10th Gen · 8GB · 256GB SSD · Tiny PC", 16499, 52000, "HP", "Desktops", ["flash-sale"], undefined,
    { processor: "Intel i5", gen: "10th Gen", ram: 8, ramType: "DDR4", ssd: "256GB", os: "Windows 10 Pro", warranty: "6 Months", stock: 6, formFactor: "Mini" }),
  product(33, "Lenovo ThinkCentre M70q G3", "i5 12th Gen · 16GB · 512GB SSD · Tiny PC", 28999, 72000, "Lenovo", "Desktops", ["new-arrival"], "New",
    { processor: "Intel i5", gen: "12th Gen", ram: 16, ramType: "DDR4", ssd: "512GB", os: "Windows 11 Pro", warranty: "1 Year", stock: 9, formFactor: "Mini" }),
  // Tower desktops
  product(41, "Dell OptiPlex 7090 Tower", "i7 11th Gen · 16GB · 1TB SSD · Win 11 Pro", 31999, 82000, "Dell", "Desktops", [], undefined,
    { processor: "Intel i7", gen: "11th Gen", ram: 16, ramType: "DDR4", ssd: "1TB", os: "Windows 11 Pro", warranty: "1 Year", stock: 7, formFactor: "Tower" }),
  product(42, "HP ProDesk 600 G6 Tower", "i5 10th Gen · 16GB · 512GB SSD · Win 11 Pro", 23999, 64000, "HP", "Desktops", [], undefined,
    { processor: "Intel i5", gen: "10th Gen", ram: 16, ramType: "DDR4", ssd: "512GB", os: "Windows 11 Pro", warranty: "6 Months", stock: 9, formFactor: "Tower" }),
  product(43, "Lenovo ThinkCentre M920 Tower", "i7 9th Gen · 32GB · 1TB SSD · Win 11 Pro", 34999, 95000, "Lenovo", "Desktops", [], undefined,
    { processor: "Intel i7", gen: "9th Gen", ram: 32, ramType: "DDR4", ssd: "1TB", os: "Windows 11 Pro", warranty: "1 Year", stock: 5, formFactor: "Tower" }),
  // All-in-One desktops
  product(44, "HP EliteOne 800 G6 AIO", '23.8" Touch · i5 10th Gen · 16GB · 512GB SSD', 36999, 99000, "HP", "Desktops", [], undefined,
    { processor: "Intel i5", gen: "10th Gen", ram: 16, ramType: "DDR4", ssd: "512GB", screen: '23.8"', os: "Windows 11 Pro", warranty: "1 Year", stock: 6, formFactor: "All-in-One" }),
  product(45, "Lenovo ThinkCentre M90a AIO", '23.8" FHD · i7 10th Gen · 16GB · 512GB SSD', 41999, 112000, "Lenovo", "Desktops", [], undefined,
    { processor: "Intel i7", gen: "10th Gen", ram: 16, ramType: "DDR4", ssd: "512GB", screen: '23.8"', os: "Windows 11 Pro", warranty: "1 Year", stock: 4, formFactor: "All-in-One" }),
  product(46, "Dell OptiPlex 7400 AIO", '23.8" FHD · i5 12th Gen · 16GB · 512GB SSD', 38999, 105000, "Dell", "Desktops", [], undefined,
    { processor: "Intel i5", gen: "12th Gen", ram: 16, ramType: "DDR4", ssd: "512GB", screen: '23.8"', os: "Windows 11 Pro", warranty: "1 Year", stock: 7, formFactor: "All-in-One" }),

  // ── monitors ──
  product(6, "Dell UltraSharp U2419H", '24" IPS · FHD · HDMI + DP · Slim Bezel', 7499, 18500, "Dell", "Monitors", ["bestseller"], undefined,
    { screen: '24"', warranty: "6 Months", stock: 15 }),
  product(14, 'LG 27" QHD Monitor', "27\" IPS · 2560×1440 · 75Hz · HDMI", 11999, 28000, "LG", "Monitors", ["flash-sale"], undefined,
    { screen: '27"', warranty: "6 Months", stock: 4 }),
  product(26, 'Acer 22" FHD Monitor', '21.5" VA · FHD · HDMI + VGA', 4999, 11000, "Acer", "Monitors", ["student"], undefined,
    { screen: '21.5"', warranty: "6 Months", stock: 25 }),
  product(35, 'Samsung 27" FHD Monitor', '27" IPS · 75Hz · Bezel-less · HDMI', 8999, 19500, "Samsung", "Monitors", ["new-arrival"], "New",
    { screen: '27"', warranty: "1 Year", stock: 11 }),

  // ── servers & workstations ──
  product(15, "HPE ProLiant DL380 G10", "2× Xeon Silver · 64GB ECC · 2× 1.2TB SAS", 89999, 310000, "HPE", "Servers", [], undefined,
    { processor: "Xeon Silver", ram: 64, ramType: "DDR4 ECC", warranty: "1 Year", stock: 3 }),
  product(16, "Dell Precision 5820 Tower", "Xeon W · 32GB · Quadro P2200 · 1TB SSD", 54999, 185000, "Dell", "Workstations", ["flash-sale"], undefined,
    { processor: "Xeon W", ram: 32, ramType: "DDR4 ECC", ssd: "1TB", gpu: "Quadro P2200", os: "Windows 11 Pro", warranty: "1 Year", stock: 5 }),
  product(36, "Dell Precision 3460 SFF", "i7 12th Gen · 32GB · T400 GPU · 1TB SSD", 64999, 168000, "Dell", "Workstations", ["new-arrival"], "New",
    { processor: "Intel i7", gen: "12th Gen", ram: 32, ramType: "DDR5", ssd: "1TB", gpu: "NVIDIA T400", os: "Windows 11 Pro", warranty: "1 Year", stock: 7 }),
];

export const CATEGORY_SLUGS = {
  laptops: "Laptops",
  desktops: "Desktops",
  monitors: "Monitors",
  servers: "Servers",
  workstations: "Workstations",
};

export const byCategory = (category) => ALL_PRODUCTS.filter((p) => p.category === category);

// Filter the pool by tag — every section derives from this.
export const byTag = (tag) => ALL_PRODUCTS.filter((p) => p.tags.includes(tag));

export const BESTSELLERS = byTag("bestseller");
export const FLASH_SALE_PRODUCTS = byTag("flash-sale");
export const STUDENT_PICKS = byTag("student");
export const NEW_ARRIVALS = byTag("new-arrival");

// Why Buy Refurbished — PRD §4.1: Save 60% | Eco-friendly | Grade Certified
export const WHY_STATS = [
  { target: 60, suffix: "%", label: "Average savings vs. buying new", note: "Same machine, a fraction of the price." },
  { target: 18500, suffix: "+", label: "Devices given a second life", note: "Kept out of landfills, certified e-waste channels." },
  { target: 32, suffix: "-pt", label: "Grade certification on every unit", note: "Inspection report ships in the box." },
];

export const REVIEWS = [
  {
    name: "Rohit Sharma",
    city: "Bengaluru",
    rating: 5,
    product: "ThinkPad T480 · 16GB",
    text: "Honestly couldn't tell it was refurbished. Battery report in the box matched what was advertised. Three months in, zero issues.",
  },
  {
    name: "Priya Nair",
    city: "Kochi",
    rating: 5,
    product: "MacBook Air M1",
    text: "Saved ₹45,000 over a new one. Minor scuff on the lid exactly as the grading described — everything else is flawless.",
  },
  {
    name: "Imran Qureshi",
    city: "Lucknow",
    rating: 4,
    product: "25× OptiPlex 7080 (school lab)",
    text: "Ordered 25 units for our computer lab. GST invoice, uniform specs, delivered in 6 days. One unit had a dead fan — replaced within the week.",
  },
  {
    name: "Ananya Gupta",
    city: "Delhi",
    rating: 5,
    product: "Latitude 3400 · student",
    text: "First laptop I bought with my own money. ₹14k for an SSD machine that handles my entire coursework. The 7-day return window made it feel safe.",
  },
];

export const WHATSAPP_NUMBER = "918448296273"; // configurable from admin settings in real build
export const WHATSAPP_MESSAGE =
  "Hi, I am interested in a bulk order from RefurbishedKart. Please share a quote.";

export const BULK_CATEGORIES = ["Laptops", "Desktops", "Monitors", "Servers", "Workstations", "Mixed"];

export const BRANDS = [
  "Dell", "HP", "Lenovo", "Apple", "Asus", "Acer", "Samsung", "LG", "MSI", "HPE", "Cisco", "BenQ",
];

export const BUDGET_TIERS = [
  {
    cap: "Under ₹15,000",
    blurb: "Reliable everyday machines for browsing, classes and office basics.",
    examples: "ThinkPad L-series · Latitude 3000 · FHD monitors",
  },
  {
    cap: "Under ₹25,000",
    blurb: "8th–10th Gen i5s with SSDs. The sweet spot for most buyers.",
    examples: "EliteBook G5/G6 · Latitude 5000 · OptiPlex SFF",
  },
  {
    cap: "Under ₹40,000",
    blurb: "Premium ultrabooks and workstation-grade power, minus the price tag.",
    examples: "X1 Carbon · MacBook Air M1 · Latitude 7000",
  },
];

// Single source of truth for return reasons — used by BOTH the customer return
// form and the admin "create return on behalf of customer" form.
export const RETURN_REASONS = [
  "Defective / Not working",
  "Physical damage received",
  "Wrong item received",
  "Change of mind",
  "Other",
];

export const FAQS = [
  {
    q: "What exactly does 'refurbished' mean at RefurbishedKart?",
    a: "Every device is sourced from corporate IT fleets, run through a 32-point hardware inspection, professionally cleaned, performance-benchmarked, and re-imaged with genuine Windows. Anything that fails inspection gets repaired with OEM-grade parts or rejected.",
  },
  {
    q: "What warranty do I get?",
    a: "Every product ships with a minimum 6-month warranty, extendable to 1 year at checkout. Warranty covers all hardware faults — no fine print on 'wear and tear' for core components.",
  },
  {
    q: "Can I return a device if I don't like it?",
    a: "Yes. There's a 7-day return window from delivery for damage, defects, or a wrong item — an unboxing video recorded at delivery is required. Change-of-mind returns are also accepted within 7 days, subject to conditions and a restocking fee. See our Return Policy for full details.",
  },
  {
    q: "Can I cancel my order?",
    a: "Yes, orders can be cancelled before dispatch by calling or WhatsApping us at +91 8448296273 (Mon–Sat, 11AM–6PM). Once dispatched, cancellation is not possible. You may initiate a return after delivery — a ₹999 restocking fee applies. See our Return Policy for details.",
  },
  {
    q: "How is the battery health on refurbished laptops?",
    a: "We guarantee minimum 80% battery health on every laptop, verified during inspection and printed on the certification card in the box. Batteries below that threshold are replaced before sale.",
  },
  {
    q: "Do you offer GST invoices and bulk pricing?",
    a: "Yes — every order includes a GST invoice, and orders of 5+ units qualify for custom bulk pricing with dedicated account support. Use the Bulk Enquiry form or WhatsApp us.",
  },
];

export const POLICIES = [
  { label: "7-Day Return Policy", icon: "return" },
  { label: "Up to 1-Year Warranty", icon: "warranty" },
  { label: "100% Secure Payment", icon: "secure" },
  { label: "Free Insured Delivery", icon: "delivery" },
];

export const FOOTER_COLS = [
  {
    title: "Shop",
    links: ["Laptops", "Desktops", "Monitors", "Servers", "Workstations", "Accessories"],
  },
  {
    title: "Company",
    links: ["About Us", "Why Refurbished", "Our Process", "Careers", "Press"],
  },
  {
    title: "Support",
    links: ["Track Order", "Shipping Policy", "Warranty Claim", "Returns & Refunds", "FAQs", "Contact Us"],
  },
  {
    title: "Business",
    links: ["Bulk Orders", "Corporate Buyback", "Partner With Us", "GST Billing"],
  },
  {
    title: "Shop by Brand",
    links: ["Dell", "HP", "Lenovo", "Apple"],
  },
];

export const formatINR = (n) => {
  if (n === undefined || n === null || isNaN(n)) return "₹0";
  return "₹" + Number(n).toLocaleString("en-IN");
};

// Seller's registered state — intra-state orders get CGST+SGST, others IGST.
export const SELLER_STATE = "Delhi";

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman & Nicobar Islands", "Chandigarh", "Dadra & Nagar Haveli and Daman & Diu",
  "Delhi", "Jammu & Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

/* GST is EMBEDDED in the inclusive price — never added on top.
   Reverse it out: taxPortion = inclusive × 18/118.
   Legacy single-rate helper, kept for back-compat (checkout estimate). */
export function gstBreakup(inclusiveAmount, interState) {
  const tax = Math.round((inclusiveAmount * 18) / 118);
  return interState
    ? { igst: tax, total: tax }
    : { cgst: Math.round(tax / 2), sgst: tax - Math.round(tax / 2), total: tax };
}

/* Per-line GST for mixed rates. Each line carries an inclusive unitPrice and a
   per-product gstRate (percent). An order-level inclusive `discount` is allocated
   across lines proportionally (largest-remainder on the last line) so the parts
   sum back exactly. Returns per-line excl/tax breakdown plus an aggregate
   CGST/SGST (intra-state) or IGST (inter-state) that foots to the line taxes.
   `fallbackRate` is used when a line has no gstRate (old orders / store default). */
export function computeLineTaxes(lines, discount = 0, interState = false, fallbackRate = 18) {
  const items = (lines || []).map((l) => {
    const rate = Number(l.gstRate) > 0 ? Number(l.gstRate) : Number(fallbackRate) || 18;
    const qty = Number(l.qty) || 1;
    const inclTotal = (Number(l.unitPrice) || 0) * qty;
    return { ...l, rate, qty, inclTotal };
  });
  const subtotal = items.reduce((a, l) => a + l.inclTotal, 0);
  const disc = Number(discount) || 0;

  let allocated = 0;
  const out = items.map((l, i) => {
    const isLast = i === items.length - 1;
    const lineDiscount = isLast
      ? disc - allocated
      : subtotal > 0
      ? Math.round((disc * l.inclTotal) / subtotal)
      : 0;
    allocated += lineDiscount;
    const netIncl = l.inclTotal - lineDiscount;
    const gstAmount = Math.round((netIncl * l.rate) / (100 + l.rate));
    const exclTotal = netIncl - gstAmount;
    return {
      ...l,
      lineDiscount,
      netIncl,
      gstAmount,
      exclTotal,
      exclUnit: Math.round(exclTotal / l.qty),
    };
  });

  const totalTax = out.reduce((a, l) => a + l.gstAmount, 0);
  const cgst = Math.round(totalTax / 2);
  const gst = interState
    ? { igst: totalTax, total: totalTax }
    : { cgst, sgst: totalTax - cgst, total: totalTax };
  const taxableExcl = out.reduce((a, l) => a + l.exclTotal, 0);
  return { lines: out, gst, totalTax, taxableExcl, subtotal };
}

/* Friendly display label for a stored paymentMethod. Case-insensitive, so it works
   whether the value is "CARD", "card", "COD", etc. Used by invoice, account + admin. */
export function paymentMethodLabel(method) {
  const m = String(method || "").toUpperCase();
  const LABELS = {
    CARD: "Card",
    UPI: "UPI",
    NETBANKING: "Net Banking",
    WALLET: "Wallet",
    EMI: "EMI",
    PAYLATER: "Pay Later",
    COD: "Cash on Delivery",
    ONLINE: "Online",
  };
  return LABELS[m] || (method ? String(method) : "—");
}
