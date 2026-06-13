import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { userFromRequest } from "@/lib/server/jwt";

export const dynamic = "force-dynamic";

const MAX_BYTES = 3 * 1024 * 1024; // 3MB
const ALLOWED = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "returns");

// Customer-accessible image upload for return photos (any signed-in user).
export async function POST(req) {
  const auth = userFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Login required" }, { status: 401 });
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

    return NextResponse.json({ url: `/uploads/returns/${name}` }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
