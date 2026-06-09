import { dbConnect } from "@/lib/server/mongoose";
import { Settings } from "@/lib/server/models";

export const SETTINGS_DEFAULTS = {
  storeName: "RefurbishedKart",
  supportEmail: "support@refurbishedkart.com",
  supportPhone: "+91 98765 43210",
  whatsappNumber: "919876543210",
  gstin: "00AAAAA0000A1Z0",
  address: "402, Brigade Gateway, Rajajinagar, Bengaluru, KA — 560055",
  freeDeliveryAbove: 999,
  deliveryFee: 99,
  codLimit: 29999,
  lowStockThreshold: 5,
  announcementText: "Free delivery on orders above ₹999 · GST invoice on every order",
  announcementActive: true,
  announcementLink: "/products/laptops",
};

/* Merged store settings — DB overrides the defaults. */
export async function getStoreSettings() {
  await dbConnect();
  const doc = await Settings.findById("store").lean();
  return { ...SETTINGS_DEFAULTS, ...(doc?.data || {}) };
}

/* Delivery thresholds, accepting both naming conventions. */
export function deliveryRules(s) {
  return {
    freeDeliveryAbove: Number(s.freeDeliveryThreshold ?? s.freeDeliveryAbove ?? 999),
    deliveryFee: Number(s.deliveryCharge ?? s.deliveryFee ?? 99),
  };
}
