import { NextResponse } from "next/server";
import { getStoreSettings } from "@/lib/server/settings";

export const dynamic = "force-dynamic";

/* Announcement bar from Settings. Returns null when inactive so the bar hides. */
export async function GET() {
  try {
    const s = await getStoreSettings();
    if (!s.announcementActive || !s.announcementText) {
      return NextResponse.json({ active: false, text: "", link: null });
    }
    return NextResponse.json({
      active: true,
      text: s.announcementText,
      link: s.announcementLink || null,
      announcementBg: s.announcementBg || "#2D5016",
      announcementTextColor: s.announcementTextColor || "#FFFFFF",
    });
  } catch (e) {
    return NextResponse.json({ active: false, text: "", link: null, error: e.message }, { status: 500 });
  }
}
