import { dbConnect } from "@/lib/server/mongoose";
import { Settings } from "@/lib/server/models";

export const SETTINGS_DEFAULTS = {
  // General
  storeName: "RefurbishedKart",
  tagline: "Certified refurbished tech",
  logoUrl: "",
  faviconUrl: "",
  supportEmail: "support@refurbishedkart.com",
  supportPhone: "+91 8448296273",
  whatsappNumber: "918448296273",
  gstin: "00AAAAA0000A1Z0",
  cin: "",
  pan: "",
  address: "147, Patparganj Industrial Area, Near Anand Vihar, Delhi — 110092",
  // Policies
  returnDays: 7,
  warrantyDefault: "6 Months",
  gstRate: 18,
  hsnDefault: "8471",
  privacyText: "",
  termsText: "",
  returnText: "",
  warrantyText: "",
  // Delivery
  freeDeliveryAbove: 7999,
  deliveryFee: 199,
  codEnabled: true,
  codLimit: 29999,
  // COD upfront is a fixed 10% of order value (+ shipping), computed at checkout —
  // not an editable flat amount. (No codAdvance default.)
  deliveryDaysMin: 3,
  deliveryDaysMax: 5,
  serviceablePincodes: "",
  lowStockThreshold: 5,
  // Appearance
  primaryColor: "#1B5E20",
  secondaryColor: "#B71C1C",
  announcementText: "Free delivery on orders above ₹7,999 · GST invoice on every order",
  announcementActive: true,
  announcementLink: "/products/laptops",
  announcementBg: "#1B5E20",
  // Hero (homepage) — fully editable from admin Settings → Appearance
  heroEyebrow: "Certified Refurbished",
  heroHeadline: "Premium laptops & desktops,",
  heroHeadlineAccent: "renewed.",
  heroSubtext:
    "Enterprise-grade machines, fully tested and warrantied. GST invoice, 7-day returns, free delivery across India.",
  heroCtaPrimaryText: "Shop Laptops",
  heroCtaPrimaryLink: "/products/laptops",
  heroCtaSecondaryText: "Explore Deals",
  heroCtaSecondaryLink: "/flash-sale",
  heroBackgroundType: "gradient", // gradient | image | video
  heroBackgroundImage: "",
  heroBackgroundVideo: "https://videos.pexels.com/video-files/3252223/3252223-uhd_2560_1440_25fps.mp4",
  heroOverlayDarkness: 80, // 0–100 → overlay opacity
  // Multi-slide hero carousel (admin-managed). Empty → migrated from the legacy
  // flat hero* fields above at read time (see lib/heroSlides.js).
  heroSlides: [],
  // ── Flash Sale (fully admin-editable; everything below is a flat key on the
  //    single Settings doc so no new collection is needed) ──
  // Sale
  flashSaleActive: false,
  flashSaleTitle: "Flash Sale",
  flashSaleSubtitle: "Limited-time deals — up to 60% off certified refurbished tech.",
  flashSaleCtaText: "Shop the Sale",
  flashSaleCtaLink: "/flash-sale",
  // Timer (independent of the sale toggle)
  flashTimerActive: false,
  flashSaleEndsAt: "", // datetime-local string "YYYY-MM-DDTHH:mm" (admin local time)
  // Announcement bar (independent toggle)
  flashBarActive: false,
  flashBarText: "Flash Sale Live — Up to 60% off!",
  flashBarBg: "#B5532A",
  flashBarTextColor: "#FFFFFF",
  flashBarPosition: "top", // top | below-navbar | bottom
  // Banner (on the flash-sale page)
  flashBannerImage: "",
  flashBannerBg: "#1B5E20",
  flashBannerTextColor: "#FFFFFF",
  flashBannerPosition: "hero", // top | below-title | above-products | hero
  // Page slug + redirect bookkeeping
  flashSaleSlug: "flash-sale", // stored without leading slash
  flashSalePrevSlug: "", // previous slug → 308-redirects to the current one
  // Homepage section
  flashHomeActive: true,
  flashHomePosition: "after-hero", // after-hero | after-featured | before-budget | before-footer
  // Social
  facebookUrl: "",
  instagramUrl: "",
  twitterUrl: "",
  linkedinUrl: "",
  youtubeUrl: "",
  googleBusinessUrl: "",
  // SEO & scripts
  gaId: "",
  gscVerification: "",
  fbPixelId: "",
  headerScripts: "",
  footerScripts: "",
  // Email templates: { [status]: { subject, body } }
  emailTemplates: {},
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
    freeDeliveryAbove: Number(s.freeDeliveryThreshold ?? s.freeDeliveryAbove ?? 7999),
    deliveryFee: Number(s.deliveryCharge ?? s.deliveryFee ?? 199),
  };
}
