// ── PDP mock helpers. No backend — everything deterministic so SSR and
// client hydration always agree (no Math.random at render time). ──

import { formatINR } from "@/lib/data";

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
  // Variant selection only makes sense where RAM exists (laptops/desktops/workstations)
  if (product.attrs.ram === undefined) return null;

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

export const priceFor = (product, ram, ssd) =>
  basePriceFor(product) + ramPriceFor(product, ram) + (COMPONENT_PRICES.ssd[ssd] ?? 0);

/* Resolve a cart-ready config for a product. With no ram/ssd given (e.g. the
   listing-card Add to Cart), uses the default selection. Returns the same
   unitPrice + sellable the PDP would show — GST-inclusive, no tax added. */
export function cartConfigFor(product, ram, ssd) {
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
  const resolution = a.screen
    ? isMac
      ? "2560 × 1600 Retina"
      : "1920 × 1080 FHD"
    : undefined;
  const weight = a.screen
    ? { '13.3"': "1.29 kg", '13.4"': "1.2 kg", '13.5"': "1.27 kg", '14"': "1.46 kg", '15.6"': "1.78 kg" }[a.screen] ?? "1.5 kg"
    : undefined;
  const ports =
    product.category === "Laptops"
      ? isMac
        ? "2× Thunderbolt / USB 4, 3.5mm jack"
        : "2× USB-A 3.2, 1× USB-C, HDMI, RJ45, 3.5mm jack"
      : product.category === "Monitors"
      ? "HDMI, DisplayPort, VGA (model dependent)"
      : "USB-A ×6, USB-C, DisplayPort, RJ45";

  return [
    ["Processor", a.processor],
    ["Generation", a.gen],
    ["RAM Type", a.ramType],
    ["Display Size", a.screen],
    ["Touchscreen", product.category === "Laptops" ? (a.touchscreen ? "Yes" : "No") : undefined],
    ["Resolution", resolution],
    ["Operating System", a.os],
    ["Battery", product.category === "Laptops" ? "Min. 80% health — tested & certified" : undefined],
    ["Ports", ports],
    ["Weight", weight],
    ["Warranty Period", a.warranty],
    ["Data Wipe Certified", "Yes — NIST 800-88 wipe certificate included"],
  ].filter(([, v]) => {
    // hide-empty rule: drop undefined/null/empty/0/N/A — never show blank rows
    if (v === undefined || v === null || v === 0) return false;
    const s = String(v).trim().toLowerCase();
    return s !== "" && s !== "n/a" && s !== "none";
  });
}

/* Mock rich-text description */
export function descriptionFor(product) {
  const a = product.attrs;
  return {
    paragraphs: [
      `The ${product.name} is a certified refurbished ${product.category
        .toLowerCase()
        .replace(/s$/, "")} sourced from corporate IT fleets, where machines are maintained on strict service schedules and replaced long before end of life. ${
        a.processor ? `Powered by an ${a.processor}${a.gen ? ` (${a.gen})` : ""}, it ships ready for daily work straight out of the box.` : ""
      }`,
      `Before listing, every unit clears our 32-point hardware inspection: chassis and hinge integrity, keyboard and trackpad wear, display uniformity, thermals under load, and storage health. ${
        product.category === "Laptops" ? "Batteries below 80% health are replaced, never resold. " : ""
      }Storage is wiped to NIST 800-88 standard and re-imaged with a genuine OS license — the wipe certificate ships in the box.`,
      `Your purchase is covered by a ${a.warranty ?? "6-month"} onsite warranty and a 7-day no-questions replacement window, with a GST invoice included for business buyers.`,
    ],
    highlights: [
      "32-point certified inspection report included",
      "NIST 800-88 data wipe certificate in the box",
      `${a.warranty ?? "6 Months"} onsite warranty, extendable at checkout`,
      "7-day no-questions-asked replacement",
    ],
  };
}

/* ── PDP customer reviews — mock data, "approved" only (PRD §6.6: pending/
   rejected reviews never reach the page). Keyed by product id; products
   without an entry show the empty state. ── */
const rv = (name, rating, date, text, verified = true) => ({ name, rating, date, text, verified });

const REVIEWS_BY_PRODUCT = {
  2: [
    rv("Arjun M.", 5, "28 May 2026", "Second ThinkPad I've bought from here. Battery report matched the listing exactly and the chassis had barely a scratch. The onboard 16GB is plenty for my dev work."),
    rv("Kavitha R.", 4, "19 May 2026", "Solid machine for the price. One USB port is slightly loose but everything works. Delivery took 4 days to Coimbatore."),
    rv("Dheeraj S.", 5, "11 May 2026", "Came with the inspection card and wipe certificate as promised. Feels like a new laptop at a third of the price."),
    rv("Meera P.", 4, "02 May 2026", "Keyboard is excellent, screen has no dead pixels. Took one star off because the box arrived a bit dented — laptop was fine though."),
    rv("Rahul V.", 5, "24 Apr 2026", "Upgraded to 32GB at checkout. Runs my VMs without breaking a sweat. GST invoice came instantly by email.", true),
  ],
  3: [
    rv("Sneha K.", 5, "30 May 2026", "Genuinely could not find a flaw. Battery health showed 87% and it looks untouched. Saved nearly half versus a new M1."),
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
    body: "Every device passes a 32-point hardware and cosmetic inspection covering chassis, display, keyboard, battery, thermals and storage health. Units are graded A/B/C and the grade is printed on the certification card that ships in the box. Anything that fails inspection is repaired with OEM-grade parts or rejected entirely.",
  },
  {
    id: "returns",
    label: "7 Day Returns",
    body: "Changed your mind, or the device doesn't match its listing? You have 7 days from delivery for a no-questions-asked replacement or full refund. If the fault is ours, return shipping is on us. Refunds are processed to the original payment method within 5 working days of pickup.",
  },
  {
    id: "warranty",
    label: "Warranty",
    body: "Your device is covered by an onsite warranty against all hardware faults — no fine print on wear-and-tear for core components. The warranty period for this product is shown on this page and on your invoice. Extended cover up to 1 year is available at checkout. Claims are raised from your account or via WhatsApp support.",
  },
  {
    id: "gst",
    label: "GST Invoice Available",
    body: "Every order ships with a GST-compliant tax invoice in the buyer's or company's name, enabling input tax credit for registered businesses. For bulk orders, consolidated invoicing and PO-based billing are available through the Bulk Enquiry desk.",
  },
  {
    id: "wiped",
    label: "Data Wiped & Certified",
    body: "All storage is sanitised to NIST 800-88 'Purge' standard before resale — not just formatted. Each device ships with its individual wipe certificate including drive serial number, method and timestamp. Previous-owner data is unrecoverable by any commercial means.",
  },
];

/* ── 14-point inspection report (Device Condition Panel).
   Text is identical across devices, so it lives here once; applicability per
   row is derived from the product's attributes/category. ── */
const INSPECTION = [
  { key: "display", name: "Display", text: "Checked for dead pixels and brightness uniformity. Minimal to no scratches visible under normal use." },
  { key: "keyboard", name: "Keyboard", text: "All keys tested and functional. No missing or sticky keys." },
  { key: "trackpad", name: "Trackpad", text: "Click and gesture response tested and working correctly." },
  { key: "battery", name: "Battery Health", text: "Tested and functional. Holds charge as expected for its age." },
  { key: "ports", name: "Ports", text: "All USB, HDMI, and audio ports tested and functional." },
  { key: "speakers", name: "Speakers", text: "Audio output tested on both channels. Clear sound, no distortion." },
  { key: "webcam", name: "Webcam", text: "Functional. Image quality as expected for the model." },
  { key: "hinges", name: "Hinges", text: "Smooth open and close. No wobble or excessive stiffness." },
  { key: "body", name: "Body / Chassis", text: "Minor scratches may be visible on the body — normal for a refurbished device. No cracks or dents." },
  { key: "storage", name: "Storage / SSD", text: "Read and write speeds verified. No bad sectors detected." },
  { key: "ram", name: "RAM", text: "Tested at rated speed. All modules functional." },
  { key: "cooling", name: "Cooling / Fan", text: "No abnormal noise. Temperature within normal range." },
  { key: "datawipe", name: "Data Wipe", text: "Certified data destruction performed. DoD 5220.22-M standard." },
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
    datawipe: hasStorage,
    bios: hasOS,
  };

  return INSPECTION.map((c) => ({ ...c, applicable: applicable[c.key] !== false }));
}

export { formatINR };
