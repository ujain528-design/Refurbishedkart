import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/adminAuth";

export const dynamic = "force-dynamic";

// Official manufacturer domains — results from these sort to the front so the
// admin sees genuine product shots before marketplace/blog re-uploads.
const MANUFACTURER_DOMAINS = [
  "dell.com", "hp.com", "lenovo.com", "asus.com", "acer.com",
  "samsung.com", "lg.com", "microsoft.com", "apple.com", "msi.com",
];
const isManufacturer = (src) => {
  const d = String(src || "").toLowerCase();
  return MANUFACTURER_DOMAINS.some((m) => d === m || d.includes(m));
};

/* POST { modelName } — Google Images search via SerpAPI. Admin-only. Returns
   { images: [{ url, thumbnail, title, source }] }, up to 20, manufacturer
   sources first. A missing key is a clear 500; any other failure returns []. */
export async function POST(req) {
  const { error } = requireAdmin(req);
  if (error) return error;

  const key = process.env.SERPAPI_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "Image search is not configured. Set SERPAPI_KEY in the environment." },
      { status: 500 }
    );
  }

  try {
    const { modelName } = await req.json();
    const model = String(modelName || "").trim();
    if (!model) return NextResponse.json({ images: [] });

    const params = new URLSearchParams({
      engine: "google_images",
      q: `${model} official product image white background`,
      api_key: key,
      num: "20",
      safe: "off",
    });

    const res = await fetch(`https://serpapi.com/search?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) return NextResponse.json({ images: [] });
    const data = await res.json().catch(() => null);
    if (!data || !Array.isArray(data.images_results)) return NextResponse.json({ images: [] });

    const images = data.images_results
      .slice(0, 20)
      .map((r) => ({
        url: r.original,
        thumbnail: r.thumbnail || r.original,
        title: r.title || "",
        source: r.source || "",
      }))
      .filter((x) => x.url);

    // Manufacturer sources first; stable otherwise.
    images.sort((a, b) => Number(isManufacturer(b.source)) - Number(isManufacturer(a.source)));

    return NextResponse.json({ images });
  } catch {
    return NextResponse.json({ images: [] });
  }
}
