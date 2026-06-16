import { NextResponse } from "next/server";
import { getStoreSettings } from "@/lib/server/settings";

export const dynamic = "force-dynamic";

const slugify = (v) => String(v || "flash-sale").trim().replace(/^\/+/, "") || "flash-sale";

/* Public, buyer-facing Flash Sale config consumed by the announcement bar, the
   homepage section and the flash-sale page. Always returns a stable shape; the
   `active` flag is the single source of truth for "is the sale live". */
export async function GET() {
  try {
    const s = await getStoreSettings();
    return NextResponse.json(
      {
        active: !!s.flashSaleActive,
        title: s.flashSaleTitle || "",
        subtitle: s.flashSaleSubtitle || "",
        ctaText: s.flashSaleCtaText || "",
        ctaLink: s.flashSaleCtaLink || "/flash-sale",
        slug: slugify(s.flashSaleSlug),
        timer: {
          active: !!s.flashTimerActive,
          endsAt: s.flashSaleEndsAt || "",
        },
        bar: {
          active: !!s.flashBarActive,
          text: s.flashBarText || "",
          bg: s.flashBarBg || "#B5532A",
          textColor: s.flashBarTextColor || "#FFFFFF",
          position: s.flashBarPosition || "top",
        },
        banner: {
          image: s.flashBannerImage || "",
          bg: s.flashBannerBg || "#1B5E20",
          textColor: s.flashBannerTextColor || "#FFFFFF",
          position: s.flashBannerPosition || "hero",
        },
        home: {
          active: s.flashHomeActive !== false,
          position: s.flashHomePosition || "after-hero",
        },
      },
      { headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" } }
    );
  } catch (e) {
    return NextResponse.json({ active: false, error: e.message }, { status: 500 });
  }
}
