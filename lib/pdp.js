// ── PDP mock helpers. No backend — everything deterministic so SSR and
// client hydration always agree (no Math.random at render time). ──

import { formatINR } from "@/lib/data";
import { formatPorts } from "@/lib/ports";

/* Component-based pricing (PRD pricing-engine model):
   every component has a real value — including the smallest tier.
   base = listed price minus the default components,
   total = base + selected RAM + selected SSD.
   Listed price always equals the default-config total by construction.
   Internal only — never shown to customers.

   RAM is priced by TYPE × CAPACITY — the same capacity costs differently in
   DDR3 vs DDR4 vs DDR5 (admin's global table, PRD §6.5). A product's RAM type
   comes from its master-data attribute; unknown types fall back to DDR4 rates.
   SSD table is flat for now but keyed the same way when storage type matters. */
export const COMPONENT_PRICES = {
  ram: {
    DDR3: { 4: 400, 8: 500, 16: 1400, 32: 3200 },
    DDR4: { 4: 600, 8: 800, 16: 2200, 32: 4800 },
    "DDR4 ECC": { 16: 2600, 32: 5400, 64: 11000 },
    DDR5: { 8: 1100, 16: 2900, 32: 6200 },
    LPDDR3: { 8: 900, 16: 2400 },
    LPDDR4X: { 8: 1000, 16: 2600, 32: 5600 },
  },
  ssd: { "256GB": 1000, "512GB": 2200, "1TB": 3800 },
};

export const ramPriceFor = (product, size) => {
  const table = COMPONENT_PRICES.ram[product.attrs.ramType] ?? COMPONENT_PRICES.ram.DDR4;
  return table[size] ?? COMPONENT_PRICES.ram.DDR4[size] ?? 0;
};

/* RAM rules per model (definable per product at listing time):
   - onboardRam: <GB> → that amount is onboard; base price includes it,
     no lower tiers offered.
   - ramExpandable → onboard models with a free slot still offer upgrades
     above the onboard amount; non-expandable models are fixed.
   - LPDDR ramType with nothing declared → onboard at installed size,
     not expandable (soldered by definition). Both fields can override. */
const isLpddr = (product) => product.attrs.ramType?.startsWith("LPDDR");

export const onboardRamFor = (product) =>
  product.onboardRam ?? (isLpddr(product) ? product.attrs.ram : null);

const ramExpandableFor = (product) =>
  product.ramExpandable ?? !isLpddr(product);

export const defaultRamFor = (product) => onboardRamFor(product) ?? 8;

/* SSD rules — mirror of RAM. Apple Silicon storage is soldered, so those
   models are auto-fixed at the installed capacity. Other models can declare
   `onboardSsd: "512GB"` (+ optional `ssdExpandable`) per listing. */
const isAppleSoldered = (product) => product.attrs.processor?.startsWith("Apple");

export const onboardSsdFor = (product) =>
  product.onboardSsd ?? (isAppleSoldered(product) ? product.attrs.ssd : null);

const ssdExpandableFor = (product) =>
  product.ssdExpandable ?? !isAppleSoldered(product);

export const defaultSsdFor = (product) => onboardSsdFor(product) ?? "256GB";

export const basePriceFor = (product) =>
  product.price -
  ramPriceFor(product, defaultRamFor(product)) -
  (COMPONENT_PRICES.ssd[defaultSsdFor(product)] ?? COMPONENT_PRICES.ssd["256GB"]);

const RAM_OPTIONS = [8, 16, 32];
const SSD_OPTIONS = ["256GB", "512GB", "1TB"];

/* Deterministic per-combination stock derived from product id.
   Values > 10 fold to 0 → some combos are Unavailable; ≤5 → low stock. */
/* Stock is tracked PER COMPONENT, not per combination — a refurbisher holds
   piles of RAM modules and SSDs, so any in-stock SSD fits any in-stock RAM
   config. A configuration is available iff every selected component is in
   stock; sellable quantity = min(unit stock, each component's stock). */
const fold = (s) => (s > 10 ? 0 : s); // deterministic 0–10, some zeros

export function variantsFor(product) {
  // Variant selection only makes sense where RAM exists (laptops/desktops/workstations).
  // Monitors never have RAM/SSD variants — no selector, no "8GB / 256GB SSD" summary.
  if (product.category === "Monitors" || product.attrs.ram === undefined) return null;

  const onboard = onboardRamFor(product);
  const ramOptions =
    onboard == null
      ? RAM_OPTIONS
      : ramExpandableFor(product)
      ? [...new Set([onboard, ...RAM_OPTIONS.filter((r) => r > onboard)])]
      : [onboard];

  const onboardSsd = onboardSsdFor(product);
  const ssdFloorIdx = onboardSsd ? SSD_OPTIONS.indexOf(onboardSsd) : 0;
  const ssdOptions =
    onboardSsd == null
      ? SSD_OPTIONS
      : ssdExpandableFor(product)
      ? SSD_OPTIONS.filter((_, i) => i >= ssdFloorIdx)
      : [onboardSsd];

  const ramStock = {};
  ramOptions.forEach((ram, i) => {
    // onboard RAM ships inside every unit — limited only by unit stock
    ramStock[ram] =
      ram === onboard || product.stock === 0
        ? product.stock
        : fold((product.id * 7 + i * 5) % 13);
  });

  const ssdStock = {};
  ssdOptions.forEach((ssd, i) => {
    // onboard SSD ships inside every unit — limited only by unit stock
    ssdStock[ssd] =
      ssd === onboardSsd || product.stock === 0
        ? product.stock
        : fold((product.id * 3 + i * 7) % 13);
  });

  // default configuration must be purchasable unless the product itself is OOS
  if (product.stock !== 0) {
    if (!ramStock[ramOptions[0]]) ramStock[ramOptions[0]] = 8;
    if (!ssdStock[ssdOptions[0]]) ssdStock[ssdOptions[0]] = 8;
  }

  return {
    ramOptions,
    ssdOptions,
    ramStock,
    ssdStock,
    unitStock: product.stock,
    // onboard tiers are part of the base machine — UI labels them "(Onboard)"
    onboardRam: onboard,
    onboardSsd,
  };
}

/* Defaults: RAM 8GB else lowest offered; SSD 256GB else lowest offered.
   Onboard floors mean "lowest offered" = the onboard tier automatically. */
export function defaultSelection(variants) {
  return {
    ram: variants.ramOptions.includes(8) ? 8 : Math.min(...variants.ramOptions),
    ssd: variants.ssdOptions.includes("256GB")
      ? "256GB"
      : [...variants.ssdOptions].sort((a, b) => parseInt(a) - parseInt(b))[0],
  };
}

/* ── Chassis + configs model (admin-driven, simplified) ─────────────────
   chassisStock is the SINGLE stock number — every config shares it.
   configs[] = [{ ram:"16GB DDR4", ssd:"256GB", price, available, show }].
   Selling any config deducts 1 chassis. No per-component pools. */
export const calculateSellableQty = (product) =>
  product?.chassisStock ?? product?.stock ?? 0;

export const configList = (product) =>
  Array.isArray(product?.configs) ? product.configs.filter((c) => c && c.show !== false) : [];

export const findConfig = (product, ram, ssd) =>
  configList(product).find((c) => String(c.ram) === String(ram) && String(c.ssd) === String(ssd)) || null;

/* Price: if the product has admin-defined configs, the matching config's price
   is authoritative (admin sets it directly). Otherwise fall back to the legacy
   component-sum pricing so un-migrated products still price correctly. */
export const priceFor = (product, ram, ssd) => {
  const cfg = findConfig(product, ram, ssd);
  if (cfg) return cfg.price;
  return basePriceFor(product) + ramPriceFor(product, ram) + (COMPONENT_PRICES.ssd[ssd] ?? 0);
};

/* Resolve a cart-ready config for a product. With no ram/ssd given (e.g. the
   listing-card Add to Cart), uses the default selection. Returns the same
   unitPrice + sellable the PDP would show — GST-inclusive, no tax added. */
export function cartConfigFor(product, ram, ssd) {
  // Chassis + configs model: sellable = chassisStock (shared by all configs).
  const cfgs = configList(product);
  if (cfgs.length) {
    const sel = ram != null && ssd != null ? { ram, ssd } : { ram: cfgs[0].ram, ssd: cfgs[0].ssd };
    const cfg = findConfig(product, sel.ram, sel.ssd) || cfgs[0];
    const sellable = cfg.available === false ? 0 : calculateSellableQty(product);
    return { ram: cfg.ram, ssd: cfg.ssd, ramType: null, unitPrice: cfg.price, sellable };
  }
  // Legacy fallback (products without configs).
  const variants = variantsFor(product);
  if (!variants) {
    return { ram: null, ssd: null, ramType: null, unitPrice: product.price, sellable: product.stock };
  }
  const sel = ram != null && ssd != null ? { ram: Number(ram), ssd } : defaultSelection(variants);
  const sellable = Math.min(
    variants.unitStock,
    variants.ramStock[sel.ram] ?? 0,
    variants.ssdStock[sel.ssd] ?? 0
  );
  return {
    ram: sel.ram,
    ssd: sel.ssd,
    ramType: product.attrs.ramType ?? null,
    unitPrice: priceFor(product, sel.ram, sel.ssd),
    sellable,
  };
}

/* Spec table rows — attrs plus sensible derived values; rows without data are skipped. */
export function specRowsFor(product) {
  const a = product.attrs;
  const isMac = a.os === "macOS";
  // Prefer the admin-set resolution; fall back to a sensible default only when
  // a screen size exists but no resolution was entered.
  const resolution =
    a.resolution ||
    (a.screen ? (isMac ? "2560 × 1600 Retina" : "1920 × 1080 FHD") : undefined);
  // Real weight field (laptops + monitors) wins; legacy laptops fall back to a
  // screen-size estimate so older listings still show something.
  const weight = a.weight
    || (a.screen && product.category === "Laptops"
      ? { '13.3"': "1.29 kg", '13.4"': "1.2 kg", '13.5"': "1.27 kg", '14"': "1.46 kg", '15.6"': "1.78 kg" }[a.screen] ?? "1.5 kg"
      : undefined);
  // Real ports map (portType → qty), e.g. "2× USB-A · 1× USB-C". Empty → row hidden.
  const ports = formatPorts(product.ports);
  const cat = product.category;
  const isLaptop = cat === "Laptops";
  const isMonitor = cat === "Monitors";
  const isServer = cat === "Servers";
  const isWorkstation = cat === "Workstations";
  // Desktop towers (workstations/servers) never show a display/battery section.
  const showDisplay = !isWorkstation && !isServer;
  const yes = (v) => (v ? "Yes" : undefined); // show only when true; hide otherwise
  // Multi-socket servers/workstations: show "2 × Intel Xeon". Single CPU (default) is
  // implied, so the count is not printed.
  const procCount = Number(product.processorCount) || 1;
  const processorLabel = a.processor ? (procCount > 1 ? `${procCount} × ${a.processor}` : a.processor) : undefined;

  return [
    ["Processor", isMonitor ? undefined : processorLabel],
    ["Generation", isMonitor ? undefined : a.gen],
    ["RAM Type", isMonitor ? undefined : a.ramType],
    ["RAM Expandability", isMonitor ? undefined : a.ramExpandability],
    ["Display Size", showDisplay ? a.screen : undefined],
    ["Touchscreen", isLaptop && a.touchscreen !== undefined ? (a.touchscreen ? "Yes" : "No") : undefined],
    ["Resolution", showDisplay ? resolution : undefined],
    ["Panel Type", showDisplay ? a.panel : undefined],
    ["Refresh Rate", showDisplay ? a.refreshRate : undefined],
    ["Aspect Ratio", isMonitor ? a.aspectRatio : undefined],
    ["Brightness", isMonitor && a.brightness ? `${a.brightness} nits` : undefined],
    ["Response Time", isMonitor && a.responseTime ? `${a.responseTime} ms` : undefined],
    ["HDR Support", isMonitor ? yes(a.hdr) : undefined],
    ["VESA Mount", isMonitor ? yes(a.vesaMount) : undefined],
    ["Built-in Speakers", isMonitor ? yes(a.builtInSpeakers) : undefined],
    ["Form Factor", isMonitor ? undefined : (a.formFactor || a.chassis)],
    ["Graphics (GPU)", isMonitor ? undefined : a.gpu],
    ["Power Supply (PSU)", isMonitor ? undefined : a.psu],
    ["Drive Bays", isServer && a.driveBays ? String(a.driveBays) : undefined],
    ["RAID Support", isServer ? a.raid : undefined],
    ["Redundant Power", isServer ? yes(a.redundantPower) : undefined],
    ["Operating System", isMonitor ? undefined : a.os],
    ["Backlit Keyboard", isLaptop ? yes(a.backlitKeyboard) : undefined],
    ["Webcam", isLaptop ? yes(a.webcam) : undefined],
    // Show the real per-unit battery health when set; no blanket backup claim in
    // the spec table (that lives on the homepage/category pages, not the PDP).
    ["Battery Health", isLaptop ? a.batteryHealth : undefined],
    ["Ports", ports],
    ["Weight", weight],
    ["Warranty Period", a.warranty],
  ].filter(([, v]) => {
    // hide-empty rule: drop undefined/null/empty/0/N/A — never show blank rows
    if (v === undefined || v === null || v === 0) return false;
    const s = String(v).trim().toLowerCase();
    return s !== "" && s !== "n/a" && s !== "none";
  });
}

/* Parse a free-text description into structured blocks for rich rendering.
   Rules (no markdown library):
     - a line starting with "- " or "* "      → bullet item (grouped into a list)
     - a non-bullet line ending with ":" (≤50) → heading
     - a blank line                            → block break
     - anything else                           → paragraph
   Deterministic + pure, so SSR and client agree. */
export function parseDescriptionBlocks(text) {
  const raw = String(text || "").replace(/\r\n?/g, "\n");
  const blocks = [];
  let list = null;
  const flush = () => { if (list && list.length) blocks.push({ type: "list", items: list }); list = null; };

  for (const rawLine of raw.split("\n")) {
    const line = rawLine.trim();
    if (line === "") { flush(); continue; }
    if (/^[-*]\s+/.test(line)) {
      if (!list) list = [];
      list.push(line.replace(/^[-*]\s+/, "").trim());
      continue;
    }
    flush();
    if (line.endsWith(":") && line.length <= 50) blocks.push({ type: "heading", text: line });
    else blocks.push({ type: "paragraph", text: line });
  }
  flush();
  return blocks;
}

/* "About this device" content for the PDP.
   - If the admin set product.description, that drives the prose (split into
     paragraphs by blank/line breaks).
   - Otherwise we auto-generate from the product's specs.
   Warranty everywhere uses the single resolved value (product.attrs.warranty,
   resolved by GET /api/products/[id]: warrantyPeriod → store default → fallback). */
export function descriptionFor(product) {
  const a = product.attrs || {};
  const warranty = a.warranty || "6 months";
  const custom = String(product.description || "").trim();

  const generated = [
    `The ${product.name} is a certified refurbished ${product.category
      .toLowerCase()
      .replace(/s$/, "")} sourced from corporate IT fleets, where machines are maintained on strict service schedules and replaced long before end of life. ${
      a.processor ? `Powered by an ${a.processor}${a.gen ? ` (${a.gen})` : ""}, it ships ready for daily work straight out of the box.` : ""
    }`,
    `Before listing, every unit clears our 32-point hardware inspection: chassis and hinge integrity, keyboard and trackpad wear, display uniformity, thermals under load, performance benchmarking, and storage health. Each device is professionally cleaned and re-imaged with a genuine OS license.`,
    `Your purchase is covered by a ${warranty} warranty and a 7-day return window, with a GST invoice included for business buyers.`,
  ];

  const paragraphs = custom
    ? custom.split(/\n+/).map((s) => s.trim()).filter(Boolean)
    : generated;

  return {
    paragraphs,
    highlights: [
      "32-point certified inspection",
      "Performance benchmarked and re-imaged with a genuine OS",
      `${warranty} warranty, extendable at checkout`,
      "7-day return window",
    ],
  };
}

/* ── PDP customer reviews — mock data, "approved" only (PRD §6.6: pending/
   rejected reviews never reach the page). Keyed by product id; products
   without an entry show the empty state. ── */
const rv = (name, rating, date, text, verified = true) => ({ name, rating, date, text, verified });

const REVIEWS_BY_PRODUCT = {
  2: [
    rv("Arjun M.", 5, "28 May 2026", "Second ThinkPad I've bought from here. Everything matched the listing exactly and the chassis had barely a scratch. The onboard 16GB is plenty for my dev work."),
    rv("Kavitha R.", 4, "19 May 2026", "Solid machine for the price. One USB port is slightly loose but everything works. Delivery took 4 days to Coimbatore."),
    rv("Dheeraj S.", 5, "11 May 2026", "Came with the full inspection card as promised. Feels like a new laptop at a third of the price."),
    rv("Meera P.", 4, "02 May 2026", "Keyboard is excellent, screen has no dead pixels. Took one star off because the box arrived a bit dented — laptop was fine though."),
    rv("Rahul V.", 5, "24 Apr 2026", "Upgraded to 32GB at checkout. Runs my VMs without breaking a sweat. GST invoice came instantly by email.", true),
  ],
  3: [
    rv("Sneha K.", 5, "30 May 2026", "Genuinely could not find a flaw. Battery backup is solid and it looks untouched. Saved nearly half versus a new M1."),
    rv("Imtiaz A.", 5, "15 May 2026", "My second Mac from RefurbishedKart. Packaging was excellent and macOS was freshly installed, ready to set up."),
    rv("Pooja T.", 4, "06 May 2026", "Beautiful machine. One tiny scuff on the lid exactly as the grading described. Wish it had more storage but that's Apple's fault, not theirs.", false),
  ],
  13: [
    rv("Vikram N.", 4, "21 May 2026", "Bought during the flash sale — excellent value. Fan is a little audible under load but performance is exactly as listed."),
    rv("Anita D.", 5, "09 May 2026", "Office bought 6 of these. Uniform spec, all arrived together, single GST invoice. Exactly what a procurement team needs."),
  ],
  22: [
    rv("Farhan Q.", 5, "26 May 2026", "First laptop for my daughter's college. 7-day return window gave us confidence to try refurbished. Zero issues in three weeks."),
    rv("Lakshmi B.", 4, "17 May 2026", "Does everything a student needs. Battery lasts about 4 hours which is fair for the price point."),
    rv("Rohit J.", 4, "29 Apr 2026", "Good basic machine. Came clean, fast SSD, no bloatware. The i3 is fine for browsing and docs.", false),
  ],
  101: [
    rv("Tanvi S.", 5, "23 May 2026", "The XPS build quality is unreal even refurbished. Screen is gorgeous. Inspection report listed every minor blemish honestly."),
  ],
};

export const reviewsFor = (productId) => REVIEWS_BY_PRODUCT[productId] ?? [];

export const reviewSummary = (reviews) => {
  if (reviews.length === 0) return null;
  const counts = [0, 0, 0, 0, 0]; // index 0 = 1★ … index 4 = 5★
  reviews.forEach((r) => counts[r.rating - 1]++);
  const avg = reviews.reduce((a, r) => a + r.rating, 0) / reviews.length;
  return { avg: Math.round(avg * 10) / 10, total: reviews.length, counts };
};

/* Trust badge → modal content */
export const TRUST_POLICIES = [
  {
    id: "certified",
    label: "Certified Refurbished",
    body: "Every device passes a 32-point hardware and cosmetic inspection covering chassis, display, keyboard, battery, thermals and storage health. Units are graded A/B/C and the grade is printed on the certification card. Anything that fails inspection is repaired with OEM-grade parts or rejected entirely.",
  },
  {
    id: "returns",
    label: "7 Day Returns",
    body: "You have a 7-day return window from delivery. For damage, a defect, or a wrong item, an unboxing video recorded at delivery is required and return shipping is on us. Change-of-mind returns are accepted within 7 days subject to conditions and a restocking fee. Refunds go to your original payment method. See our Return Policy for full details.",
  },
  {
    id: "warranty",
    label: "Warranty",
    body: "Your device is covered by a warranty against all hardware faults — no fine print on wear-and-tear for core components. The warranty period for this product is shown on this page and on your invoice. Extended cover up to 1 year is available at checkout. Claims are raised from your account or via WhatsApp support.",
  },
  {
    id: "gst",
    label: "GST Invoice Available",
    body: "Every order ships with a GST-compliant tax invoice in the buyer's or company's name, enabling input tax credit for registered businesses. For bulk orders, consolidated invoicing and PO-based billing are available through the Bulk Enquiry desk.",
  },
];

/* ── 14-point inspection report (Device Condition Panel).
   Text is identical across devices, so it lives here once; applicability per
   row is derived from the product's attributes/category. ── */
const INSPECTION = [
  { key: "display", name: "Display", text: "Checked for dead pixels and brightness uniformity. Minimal to no scratches visible under normal use." },
  { key: "keyboard", name: "Keyboard", text: "All keys tested and functional. No missing or sticky keys." },
  { key: "trackpad", name: "Trackpad", text: "Click and gesture response tested and working correctly." },
  { key: "battery", name: "Battery Health", text: "Tested and functional." },
  { key: "ports", name: "Ports", text: "All USB, HDMI, and audio ports tested and functional." },
  { key: "speakers", name: "Speakers", text: "Audio output tested on both channels. Clear sound, no distortion." },
  { key: "webcam", name: "Webcam", text: "Functional. Image quality as expected for the model." },
  { key: "hinges", name: "Hinges", text: "Smooth open and close. No wobble or excessive stiffness." },
  { key: "body", name: "Body / Chassis", text: "Minor scratches may be visible on the body — normal for a refurbished device. No cracks or dents." },
  { key: "storage", name: "Storage / SSD", text: "Read and write speeds verified. No bad sectors detected." },
  { key: "ram", name: "RAM", text: "Tested at rated speed. All modules functional." },
  { key: "cooling", name: "Cooling / Fan", text: "No abnormal noise. Temperature within normal range." },
  { key: "performance", name: "Performance Benchmark", text: "Benchmarked under sustained load — CPU, RAM and SSD throughput verified against the model's rated performance." },
  { key: "bios", name: "BIOS / Firmware", text: "Updated to latest stable version. No BIOS lock." },
];

export function inspectionFor(product) {
  const a = product.attrs;
  const isLaptop = product.category === "Laptops";
  const isAIO = a.formFactor === "All-in-One";
  const hasScreen = !!a.screen || isLaptop;
  const hasStorage = !!a.ssd;
  const hasRam = a.ram !== undefined;
  const hasOS = !!a.os;

  const applicable = {
    display: hasScreen,
    keyboard: isLaptop,
    trackpad: isLaptop,
    battery: isLaptop,
    ports: true,
    speakers: isLaptop || isAIO,
    webcam: isLaptop || isAIO,
    hinges: isLaptop,
    body: true,
    storage: hasStorage,
    ram: hasRam,
    cooling: product.category !== "Monitors",
    performance: true,
    bios: hasOS,
  };

  return INSPECTION.map((c) => ({ ...c, applicable: applicable[c.key] !== false }));
}

export { formatINR };
