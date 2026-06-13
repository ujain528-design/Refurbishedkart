import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { requireAdmin } from "@/lib/server/adminAuth";

export const dynamic = "force-dynamic";

const MAX_BYTES = 3 * 1024 * 1024; // 3MB (hero/banner artwork)
const ALLOWED = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products");

export async function POST(req) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") return NextResponse.json({ error: "No file provided" }, { status: 400 });
    const ext = ALLOWED[file.type];
    if (!ext) return NextResponse.json({ error: "Only JPEG, PNG or WebP allowed" }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "Max file size is 3MB" }, { status: 400 });

    await mkdir(UPLOAD_DIR, { recursive: true });
    const name = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(UPLOAD_DIR, name), buf);

    return NextResponse.json({ url: `/uploads/products/${name}` }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
