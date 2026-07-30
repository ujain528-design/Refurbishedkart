import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/adminAuth";
import { getHomepageSections, publishHomepageSections } from "@/lib/server/homepage";

export const dynamic = "force-dynamic";

// GET → all sections (admin builder), sorted by order.
export async function GET(req) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    return NextResponse.json({ sections: await getHomepageSections({ activeOnly: false }) });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT → "Publish": replace the whole set (create/update/delete/reorder atomically).
export async function PUT(req) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    const { sections } = await req.json();
    const saved = await publishHomepageSections(sections);
    return NextResponse.json({ sections: saved });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
