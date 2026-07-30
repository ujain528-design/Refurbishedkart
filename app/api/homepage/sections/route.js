import { NextResponse } from "next/server";
import { getHomepageSections } from "@/lib/server/homepage";

export const dynamic = "force-dynamic";

// Public — active sections only, for the homepage DB-driven zone.
export async function GET() {
  try {
    return NextResponse.json({ sections: await getHomepageSections({ activeOnly: true }) });
  } catch (e) {
    return NextResponse.json({ sections: [], error: e.message }, { status: 500 });
  }
}
