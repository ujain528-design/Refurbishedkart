import { getStoreSettings } from "@/lib/server/settings";

export const flashSlugify = (v) => String(v || "flash-sale").trim().replace(/^\/+/, "") || "flash-sale";

/* Server-side Flash Sale config (includes prevSlug, which the public API omits).
   Used by the flash-sale page + the [flashSlug] redirect route. */
export async function getFlashConfig() {
  const s = await getStoreSettings();
  return {
    active: !!s.flashSaleActive,
    title: s.flashSaleTitle || "",
    subtitle: s.flashSaleSubtitle || "",
    ctaText: s.flashSaleCtaText || "",
    ctaLink: s.flashSaleCtaLink || "/flash-sale",
    slug: flashSlugify(s.flashSaleSlug),
    // prevSlug stays empty when unset (do NOT default to "flash-sale").
    prevSlug: String(s.flashSalePrevSlug || "").trim().replace(/^\/+/, ""),
    timer: { active: !!s.flashTimerActive, endsAt: s.flashSaleEndsAt || "" },
    banner: {
      image: s.flashBannerImage || "",
      bg: s.flashBannerBg || "#1B5E20",
      textColor: s.flashBannerTextColor || "#FFFFFF",
      position: s.flashBannerPosition || "hero",
    },
  };
}
