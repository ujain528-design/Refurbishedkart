// Persistent JSON data store (dev backend). Seeded once from the mock catalogue
// so the API serves real, queryable, mutable data. Swap for MongoDB later —
// the exported functions are the contract.
import fs from "fs";
import path from "path";
import { ALL_PRODUCTS } from "@/lib/data";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

const SEED_BANNERS = [
  { id: "b1", slide: "laptops", headline: "Premium Refurbished Laptops", sub: "Certified, tested, ready to work", cta: { label: "Shop Now", href: "/products/laptops" }, gradient: "from-[#0E3D12] via-brand to-brand-mid", clickable: true, active: true, order: 1 },
  { id: "b2", slide: "flash", headline: "Flash Sale — Up to 60% Off", sub: "Limited stock, limited time", cta: { label: "Shop Flash Sale", href: "/flash-sale" }, gradient: "from-slate-950 via-blue-950 to-blue-800", clickable: false, active: true, order: 2 },
  { id: "b3", slide: "bulk", headline: "Business Bulk Orders", sub: "GST invoice, uniform spec, PAN India delivery", cta: { label: "Get a Quote", bulk: true }, gradient: "from-neutral-950 via-neutral-800 to-neutral-600", clickable: true, active: true, order: 3 },
];

const SEED_CONTENT = {
  announcement: { active: true, text: "Free delivery on orders above ₹999 · GST invoice on every order", link: "/products/laptops" },
  footer: {
    info: { gstin: "00AAAAA0000A1Z0", phone: "+91 8448296273", email: "support@refurbishedkart.com", address: "147, Patparganj Industrial Area, Near Anand Vihar, Delhi — 110092" },
  },
};

function seed() {
  return {
    products: ALL_PRODUCTS,           // seeded from the canonical catalogue
    banners: SEED_BANNERS,
    content: SEED_CONTENT,
    orders: [],
    users: {},                        // phone/email -> { id, name, email, phone, addresses[] }
    wishlists: {},                    // userId -> [productId]
    bulkEnquiries: [],
    otps: {},                         // phone -> { code, exp }
    seq: { order: 1 },
  };
}

let cache = null;
function load() {
  if (cache) return cache;
  try {
    cache = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch {
    cache = seed();
    persist();
  }
  return cache;
}
function persist() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(cache, null, 2));
}

export function db() { return load(); }
export function save() { persist(); }
export function nextOrderId() {
  const d = load();
  const n = d.seq.order++;
  persist();
  return `RK-2026-${String(n).padStart(5, "0")}`;
}
