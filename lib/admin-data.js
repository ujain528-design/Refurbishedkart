// Mock admin data matching backend schema shapes. UI-only (Session 9).

export const DASHBOARD_STATS = [
  { label: "Orders Today", value: "23" },
  { label: "Revenue Today", value: "₹6,84,200", accent: "text-brand" },
  { label: "Active Products", value: "26" },
  { label: "Pending Reviews", value: "5", accent: "text-amber-600" },
  { label: "New Bulk Enquiries", value: "3", accent: "text-indigo-600" },
  { label: "Low Stock Alerts", value: "7", accent: "text-red-600" },
];

export const ADMIN_ORDERS = [
  { id: "RK-2026-00021", customer: "Rohit Sharma", items: "ThinkPad T14 ×1", total: 27499, method: "UPI", status: "Confirmed", date: "06 Jun 2026" },
  { id: "RK-2026-00020", customer: "Priya Nair", items: "MacBook Air M1 ×1", total: 47999, method: "Card", status: "Shipped", date: "06 Jun 2026" },
  { id: "RK-2026-00019", customer: "Imran Qureshi", items: "OptiPlex 7080 ×25", total: 624975, method: "Net Banking", status: "Packed", date: "05 Jun 2026" },
  { id: "RK-2026-00018", customer: "Ananya Gupta", items: "Latitude 3400 ×1", total: 14499, method: "COD", status: "Pending", date: "05 Jun 2026" },
  { id: "RK-2026-00017", customer: "Vikram N.", items: "X1 Carbon ×1", total: 41999, method: "UPI", status: "Delivered", date: "04 Jun 2026" },
  { id: "RK-2026-00016", customer: "Sneha K.", items: "EliteBook 840 ×2", total: 65998, method: "Wallet", status: "Delivered", date: "04 Jun 2026" },
  { id: "RK-2026-00015", customer: "Farhan Q.", items: '27" QHD Monitor ×1', total: 11999, method: "UPI", status: "Cancelled", date: "03 Jun 2026" },
  { id: "RK-2026-00014", customer: "Lakshmi B.", items: "VivoBook 14 ×1", total: 19999, method: "Card", status: "Delivered", date: "03 Jun 2026" },
  { id: "RK-2026-00013", customer: "Tanvi S.", items: "XPS 13 ×1", total: 54999, method: "UPI", status: "Returned", date: "02 Jun 2026" },
  { id: "RK-2026-00012", customer: "Dheeraj S.", items: "ThinkPad T14 ×1", total: 27499, method: "Net Banking", status: "Delivered", date: "02 Jun 2026" },
];

export const LOW_STOCK = [
  { product: "Lenovo ThinkPad X1 Carbon G8", variant: "16GB / 512GB", stock: 3 },
  { product: "Apple MacBook Air M1", variant: "8GB / 256GB", stock: 4 },
  { product: 'LG 27" QHD Monitor', variant: "—", stock: 4 },
  { product: "HPE ProLiant DL380 G10", variant: "64GB ECC", stock: 3 },
  { product: "Lenovo ThinkCentre M90a AIO", variant: "16GB / 512GB", stock: 4 },
  { product: "Apple MacBook Pro 2020 M1", variant: "8GB / 256GB", stock: 2 },
  { product: "Dell XPS 13 9310", variant: "16GB / 512GB", stock: 5 },
];

export const ADMIN_REVIEWS = [
  { id: 1, product: "ThinkPad T14", reviewer: "Arjun M.", rating: 5, text: "Couldn't tell it was refurbished. Battery report matched.", date: "28 May 2026", status: "pending" },
  { id: 2, product: "MacBook Air M1", reviewer: "Sneha K.", rating: 5, text: "Genuinely could not find a flaw.", date: "30 May 2026", status: "pending" },
  { id: 3, product: "Latitude 3400", reviewer: "Farhan Q.", rating: 5, text: "First laptop for my daughter's college.", date: "26 May 2026", status: "approved", featured: true },
  { id: 4, product: "OptiPlex 7080", reviewer: "Imran Q.", rating: 4, text: "Ordered 25 for our lab. One dead fan, replaced fast.", date: "19 May 2026", status: "approved", featured: false },
  { id: 5, product: "X1 Carbon", reviewer: "Vikram N.", rating: 4, text: "Bought during flash sale — excellent value.", date: "21 May 2026", status: "pending" },
  { id: 6, product: "VivoBook 14", reviewer: "Anon", rating: 2, text: "Arrived later than expected.", date: "11 May 2026", status: "rejected" },
];

export const ADMIN_ENQUIRIES = [
  { id: "BE-101", name: "Imran Qureshi", org: "St. Xavier School", email: "it@xavier.edu", phone: "+91 90000 11111", category: "Desktops", qty: "25", budget: "₹25,000", notes: "Need uniform spec for computer lab. GST invoice required.", status: "Quoted", date: "04 Jun 2026" },
  { id: "BE-100", name: "Meera Iyer", org: "Acme Startups", email: "ops@acme.co", phone: "+91 90000 22222", category: "Laptops", qty: "12", budget: "₹40,000", notes: "WFH machines for new hires.", status: "In Progress", date: "05 Jun 2026" },
  { id: "BE-099", name: "Rakesh P.", org: "GreenNGO", email: "admin@greenngo.org", phone: "+91 90000 33333", category: "Mixed", qty: "8", budget: "—", notes: "Mix of laptops and monitors.", status: "New", date: "06 Jun 2026" },
];

export const ADMIN_COUPONS = [
  { code: "SAVE10", type: "percentage", value: 10, min: 0, expiry: "31 Jul 2026", used: 47, limit: 100, status: "active" },
  { code: "REFURB500", type: "flat", value: 500, min: 20000, expiry: "15 Jul 2026", used: 12, limit: 200, status: "active" },
  { code: "STUDENT15", type: "percentage", value: 15, min: 0, expiry: "30 Jun 2026", used: 89, limit: 100, status: "active" },
  { code: "FIRST200", type: "flat", value: 200, min: 5000, expiry: "01 May 2026", used: 100, limit: 100, status: "exhausted" },
  { code: "DIWALI20", type: "percentage", value: 20, min: 10000, expiry: "10 Apr 2026", used: 340, limit: null, status: "expired" },
];

export const ADMIN_BANNERS = [
  { id: 1, headline: "Premium Refurbished Laptops", status: "active", clickable: true, start: "01 Jun 2026", end: "—", order: 1 },
  { id: 2, headline: "Flash Sale — Up to 60% Off", status: "active", clickable: false, start: "05 Jun 2026", end: "12 Jun 2026", order: 2 },
  { id: 3, headline: "Business Bulk Orders", status: "active", clickable: true, start: "01 Jun 2026", end: "—", order: 3 },
  { id: 4, headline: "Independence Day Sale (draft)", status: "inactive", clickable: true, start: "10 Aug 2026", end: "16 Aug 2026", order: 4 },
];

export const ADMIN_TAGS = [
  { name: "Bestseller", type: "system", count: 6, visible: true },
  { name: "Flash Sale", type: "system", count: 5, visible: true },
  { name: "New Arrival", type: "system", count: 6, visible: true },
  { name: "Best for Students", type: "system", count: 6, visible: true },
  { name: "Recommended", type: "system", count: 4, visible: true },
  { name: "Best for WFH", type: "custom", count: 8, visible: true },
  { name: "Office Picks", type: "custom", count: 5, visible: false },
];

export const HOMEPAGE_ROWS = [
  { name: "Bestsellers", tag: "Bestseller", count: 6, visible: true },
  { name: "Best for Students", tag: "Best for Students", count: 6, visible: true },
  { name: "New Arrivals", tag: "New Arrival", count: 6, visible: true },
  { name: "Best for WFH", tag: "Best for WFH", count: 8, visible: true },
];

export const RAM_PRICE_MATRIX = {
  types: ["DDR3", "DDR4", "DDR4 ECC", "DDR5", "LPDDR4X"],
  caps: [4, 8, 16, 32, 64],
  prices: {
    DDR3: { 4: 400, 8: 500, 16: 1400, 32: 3200, 64: "" },
    DDR4: { 4: 600, 8: 800, 16: 2200, 32: 4800, 64: "" },
    "DDR4 ECC": { 4: "", 8: "", 16: 2600, 32: 5400, 64: 11000 },
    DDR5: { 4: "", 8: 1100, 16: 2900, 32: 6200, 64: "" },
    LPDDR4X: { 4: "", 8: 1000, 16: 2600, 32: 5600, 64: "" },
  },
};

export const SSD_PRICE_TABLE = [
  { cap: "256GB", price: 1000 },
  { cap: "512GB", price: 2200 },
  { cap: "1TB", price: 3800 },
  { cap: "2TB", price: 6900 },
];

export const MASTER_TABLES = {
  Brands: ["Dell", "HP", "Lenovo", "Apple", "Asus", "Acer", "Samsung", "LG", "MSI", "HPE", "Microsoft"],
  "Processor Family": ["Intel Core i3", "Intel Core i5", "Intel Core i7", "AMD Ryzen 5", "AMD Ryzen 7", "Apple M1", "Xeon Silver", "Xeon W"],
  "Processor Generation": ["7th Gen", "8th Gen", "9th Gen", "10th Gen", "11th Gen", "12th Gen", "Apple M1"],
  "RAM Type": ["DDR3", "DDR4", "DDR4 ECC", "DDR5", "LPDDR3", "LPDDR4X"],
  "Storage Type": ["SSD", "NVMe SSD", "HDD"],
  "Operating System": ["Windows 10 Pro", "Windows 11 Home", "Windows 11 Pro", "macOS"],
  "Form Factor": ["Laptop", "SFF", "Mini", "Tower", "All-in-One", "Rack"],
  "Screen Size": ['13.3"', '13.4"', '13.5"', '14"', '15.6"', '21.5"', '24"', '27"'],
  "Warranty Period": ["6 Months", "1 Year"],
};

export const ADMIN_PAGES = [
  { slug: "about", title: "About Us", visible: true, core: true },
  { slug: "contact", title: "Contact Us", visible: true, core: true },
  { slug: "privacy-policy", title: "Privacy Policy", visible: true, core: true },
  { slug: "terms", title: "Terms of Service", visible: true, core: true },
  { slug: "return-policy", title: "Return & Refund Policy", visible: true, core: true },
  { slug: "warranty", title: "Warranty Policy", visible: true, core: true },
  { slug: "shipping", title: "Shipping Information", visible: false, core: false },
];

export const ADMIN_USERS = [
  { name: "Utkarsh Jain", email: "ujain528@gmail.com", role: "superadmin" },
  { name: "Ops Team", email: "ops@refurbishedkart.com", role: "admin" },
];

export const formatINR = (n) => "₹" + Number(n).toLocaleString("en-IN");
