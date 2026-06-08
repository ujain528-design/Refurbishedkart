// Mock account data — no backend (Session 7).

export const MOCK_ORDERS = [
  {
    id: "RK-2026-00012",
    date: "02 Jun 2026",
    status: "Delivered",
    items: [
      { name: "Lenovo ThinkPad T14", ram: 16, ssd: "256GB", qty: 1, price: 27499, image: "/products/thinkpad-a.avif" },
    ],
    total: 27499,
  },
  {
    id: "RK-2026-00009",
    date: "21 May 2026",
    status: "Shipped",
    items: [
      { name: "Dell Latitude 7420", ram: 8, ssd: "256GB", qty: 1, price: 38999, image: null },
      { name: 'Acer 22" FHD Monitor', ram: null, ssd: null, qty: 2, price: 4999, image: null },
    ],
    total: 48997,
  },
  {
    id: "RK-2026-00004",
    date: "08 May 2026",
    status: "Confirmed",
    items: [
      { name: "Apple MacBook Air M1", ram: 8, ssd: "256GB", qty: 1, price: 47999, image: "/products/thinkpad-b.avif" },
    ],
    total: 47999,
  },
  {
    id: "RK-2026-00002",
    date: "29 Apr 2026",
    status: "Cancelled",
    items: [
      { name: "HP ProDesk 600 G6 Mini", ram: 8, ssd: "256GB", qty: 1, price: 16499, image: null },
    ],
    total: 16499,
  },
];

export const STATUS_STYLES = {
  Pending: "bg-amber-100 text-amber-700",
  Confirmed: "bg-blue-100 text-blue-700",
  Packed: "bg-indigo-100 text-indigo-700",
  Shipped: "bg-sky-100 text-sky-700",
  Delivered: "bg-brand-soft text-brand",
  Cancelled: "bg-red-100 text-red-600",
  Returned: "bg-neutral-200 text-neutral-600",
};

export const MOCK_COUPONS = [
  { code: "SAVE10", desc: "10% off your order", min: 0, expiry: "31 Jul 2026", state: "active" },
  { code: "REFURB500", desc: "₹500 off above ₹20,000", min: 20000, expiry: "15 Jul 2026", state: "active" },
  { code: "STUDENT15", desc: "15% off student laptops", min: 0, expiry: "30 Jun 2026", state: "active" },
  { code: "FIRST200", desc: "₹200 off first order", min: 5000, expiry: "01 May 2026", state: "expired" },
  { code: "DIWALI20", desc: "20% off — festive sale", min: 10000, expiry: "10 Apr 2026", state: "used" },
];

export const MOCK_ADDRESSES = [
  { id: "a1", name: "Utkarsh Jain", phone: "+91 98765 43210", line1: "402, Brigade Gateway", line2: "Rajajinagar", city: "Bengaluru", state: "Karnataka", pincode: "560055", default: true },
  { id: "a2", name: "Utkarsh Jain (Office)", phone: "+91 98765 43210", line1: "WeWork Prestige Atlanta", line2: "Koramangala", city: "Bengaluru", state: "Karnataka", pincode: "560095", default: false },
];

export const MOCK_PROFILE = { name: "Utkarsh Jain", email: "ujain528@gmail.com", phone: "+91 98765 43210" };
