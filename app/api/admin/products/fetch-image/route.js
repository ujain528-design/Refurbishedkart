import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { requireAdmin } from "@/lib/server/adminAuth";

export const dynamic = "force-dynamic";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products");
const MAX_BYTES = 15 * 1024 * 1024; // 15MB source cap

/* POST { imageUrl } — fetch a remote image server-side (avoids browser CORS),
   normalise it to an 800×800 WebP on a white background (contain, never crop),
   save under /public/uploads/products and return { url }. Admin-only. */
export async function POST(req) {
  const { error } = requireAdmin(req);
  if (error) return error;

  try {
    const { imageUrl } = await req.json();
    const url = String(imageUrl || "").trim();
    if (!/^https?:\/\//i.test(url)) {
      return NextResponse.json({ error: "A valid http(s) image URL is required" }, { status: 400 });
    }

    // 1) Fetch the source image.
    const res = await fetch(url, { cache: "no-store", redirect: "follow" });
    if (!res.ok) return NextResponse.json({ error: `Couldn't fetch image (${res.status})` }, { status: 502 });
    const type = res.headers.get("content-type") || "";
    if (!type.startsWith("image/")) {
      return NextResponse.json({ error: "URL did not return an image" }, { status: 415 });
    }
    const srcBuf = Buffer.from(await res.arrayBuffer());
    if (srcBuf.length > MAX_BYTES) {
      return NextResponse.json({ error: "Image is too large (max 15MB)" }, { status: 413 });
    }

    // 2) Process with sharp — dynamic import so this route still parses/builds even
    //    before `npm install sharp` has run on the host.
    let sharp;
    try {
      sharp = (await import("sharp")).default;
    } catch {
      return NextResponse.json({ error: "Image processing unavailable — run `npm install sharp`." }, { status: 500 });
    }

    const out = await sharp(srcBuf)
      .resize(800, 800, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .flatten({ background: { r: 255, g: 255, b: 255 } }) // drop any transparency onto white
      .webp({ quality: 85 })
      .toBuffer();

    // 3) Save.
    await mkdir(UPLOAD_DIR, { recursive: true });
    const name = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}.webp`;
    await writeFile(path.join(UPLOAD_DIR, name), out);

    return NextResponse.json({ url: `/uploads/products/${name}` }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Image processing failed" }, { status: 500 });
  }
}
