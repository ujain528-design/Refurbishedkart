import { NextResponse } from "next/server";
import { getStoreSettings, deliveryRules } from "@/lib/server/settings";
import { resolveHeroSlides, activeSortedSlides } from "@/lib/heroSlides";

export const dynamic = "force-dynamic";

/* Public, non-admin store settings the storefront needs (delivery rules, COD
   limit, WhatsApp, low-stock threshold). No auth — these are buyer-facing. */
export async function GET() {
  try {
    const s = await getStoreSettings();
    const { freeDeliveryAbove, deliveryFee } = deliveryRules(s);
    return NextResponse.json({
      freeDeliveryAbove,
      deliveryFee,
      codLimit: Number(s.codLimit ?? 29999),
      lowStockThreshold: Number(s.lowStockThreshold ?? 5),
      whatsappNumber: s.whatsappNumber,
      storeName: s.storeName,
      returnDays: Number(s.returnDays ?? 7),
      gstRate: Number(s.gstRate ?? 18), // store default GST rate (per-product overrides win)
      // Homepage hero — admin-editable (Settings → Appearance)
      hero: {
        eyebrow: s.heroEyebrow ?? "",
        headline: s.heroHeadline ?? "",
        headlineAccent: s.heroHeadlineAccent ?? "",
        subtext: s.heroSubtext ?? "",
        ctaPrimaryText: s.heroCtaPrimaryText ?? "",
        ctaPrimaryLink: s.heroCtaPrimaryLink ?? "",
        ctaSecondaryText: s.heroCtaSecondaryText ?? "",
        ctaSecondaryLink: s.heroCtaSecondaryLink ?? "",
        backgroundType: s.heroBackgroundType ?? "gradient",
        backgroundImage: s.heroBackgroundImage ?? "",
        backgroundVideo: s.heroBackgroundVideo ?? "",
        overlayDarkness: Number(s.heroOverlayDarkness ?? 80),
      },
      // Multi-slide hero carousel — active slides only, in display order, with
      // the legacy single hero migrated to slide[0] when none are configured.
      heroSlides: activeSortedSlides(resolveHeroSlides(s)),
    }, { headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" } });
  } catch (e) {
    return NextResponse.json({ freeDeliveryAbove: 7999, deliveryFee: 199, error: e.message }, { status: 500 });
  }
}
