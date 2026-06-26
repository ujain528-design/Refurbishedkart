/* eslint-disable no-console -- CLI build script; console is the intended output. */
// One-time favicon generator.
// Generates all browser-compatible favicon assets from public/logo_rk.webp
// using sharp. Run with:  node scripts/generate-favicons.mjs
//
// sharp cannot emit .ico directly, so we render a 32x32 PNG and wrap it in a
// minimal single-image ICO container (the ICO format allows an embedded PNG
// payload — supported by every modern browser).
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(root, "public", "logo_rk.webp");
const PUB = path.join(root, "public");

// Transparent-background fit so a non-square logo is letterboxed, never cropped.
const render = (size) =>
  sharp(SRC)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

// Wrap a square PNG buffer in a 1-image ICO container.
function pngToIco(png, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: 1 = icon
  header.writeUInt16LE(1, 4); // image count

  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 means 256)
  entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
  entry.writeUInt8(0, 2); // palette
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.length, 8); // size of PNG data
  entry.writeUInt32LE(6 + 16, 12); // offset to PNG data

  return Buffer.concat([header, entry, png]);
}

async function main() {
  await fs.access(SRC); // fail loudly if the source logo is missing

  const png16 = await render(16);
  const png32 = await render(32);
  const png180 = await render(180);

  await fs.writeFile(path.join(PUB, "favicon-16x16.png"), png16);
  await fs.writeFile(path.join(PUB, "favicon-32x32.png"), png32);
  await fs.writeFile(path.join(PUB, "apple-touch-icon.png"), png180);
  await fs.writeFile(path.join(PUB, "favicon.ico"), pngToIco(png32, 32));

  console.log("✓ favicons written: favicon.ico (32), favicon-16x16.png, favicon-32x32.png, apple-touch-icon.png (180)");
}

main().catch((e) => {
  console.error("favicon generation failed:", e);
  process.exit(1);
});
