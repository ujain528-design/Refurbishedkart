// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTION DEPLOYMENT NOTE (pdfkit fonts):
// pdfkit loads its standard font metrics (.afm files) from disk at runtime, from
// node_modules/pdfkit/js/data/*.afm. On a full Node server (VPS / PM2 / Docker
// with node_modules intact) this works with no extra steps. It can BREAK only on
// bundlers/serverless that tree-shake or omit node_modules assets (e.g. a traced
// Vercel/Lambda function), where the .afm files may not be included — then
// generateInvoice() throws and the caller (payment/verify) skips the invoice.
// We deploy on a VPS, so this is a non-issue. See DEPLOYMENT_CHECKLIST.md.
// ─────────────────────────────────────────────────────────────────────────────
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { computeLineTaxes, SELLER_STATE, paymentMethodLabel } from "@/lib/data";
import { getStoreSettings } from "@/lib/server/settings";

// Invoices are PRIVATE customer documents. They are written OUTSIDE /public so
// Next never serves them as static files; access is gated by GET /api/invoices/[orderId].
export const INVOICE_DIR = path.join(process.cwd(), "private", "invoices");
export const invoiceFilePath = (invoiceNumber) => path.join(INVOICE_DIR, `${invoiceNumber}.pdf`);

const BRAND = "#1B5E20";
const INR = (n) => "Rs. " + Number(n || 0).toLocaleString("en-IN");
const hsnFor = (name) => (/monitor/i.test(name) ? "8528" : "8471"); // monitors vs computers

/* Generate a GST-compliant tax invoice PDF for an order. Saves to the PRIVATE
   private/invoices/<orderId>.pdf (never served statically) and returns the
   authenticated download URL: /api/invoices/<orderId>. */
export async function generateInvoice(order) {
  const settings = await getStoreSettings();
  const invoiceNumber = order.orderId;
  await fs.promises.mkdir(INVOICE_DIR, { recursive: true });
  const filePath = invoiceFilePath(invoiceNumber);

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  const left = 50, right = 545;
  const ship = order.shippingAddress || {};
  const buyerState = ship.state || SELLER_STATE;
  const interState = buyerState !== SELLER_STATE;

  // ── Header ──
  doc.fillColor(BRAND).font("Helvetica-Bold").fontSize(22).text("RefurbishedKart", left, 50);
  doc.fillColor("#111").font("Helvetica-Bold").fontSize(16).text("TAX INVOICE", left, 50, { align: "right" });
  doc.font("Helvetica").fontSize(9).fillColor("#555")
    .text("Original for Recipient", left, 72, { align: "right" });
  doc.fillColor("#111").fontSize(10)
    .text(`Invoice No: ${invoiceNumber}`, left, 90, { align: "right" })
    .text(`Date: ${new Date(order.createdAt || Date.now()).toLocaleDateString("en-IN")}`, left, 104, { align: "right" });
  doc.moveTo(left, 128).lineTo(right, 128).strokeColor("#ddd").stroke();

  // ── Seller (left) / Buyer (right) ──
  const top = 140;
  doc.fillColor("#111").font("Helvetica-Bold").fontSize(10).text("Sold By", left, top);
  doc.font("Helvetica").fontSize(9).fillColor("#333")
    .text(settings.storeName || "RefurbishedKart", left, top + 16, { width: 240 })
    .text(settings.address || "", { width: 240 })
    .text(`GSTIN: ${settings.gstin || "-"}`, { width: 240 })
    .text(`${settings.supportPhone || ""}  ${settings.supportEmail || ""}`, { width: 240 });

  doc.fillColor("#111").font("Helvetica-Bold").fontSize(10).text("Bill To", 320, top);
  doc.font("Helvetica").fontSize(9).fillColor("#333")
    .text(order.customerName || ship.name || "-", 320, top + 16, { width: 225 })
    .text([ship.line1, ship.line2, ship.city, `${buyerState} ${ship.pincode || ""}`].filter(Boolean).join(", "), { width: 225 });
  if (order.buyerGstin) doc.text(`GSTIN: ${order.buyerGstin}`, { width: 225 });

  // ── Items table ──
  let y = top + 90;
  const cols = { sr: left, desc: 75, hsn: 285, qty: 330, unit: 360, gstp: 420, gsta: 455, total: 500 };
  const headerRow = (yy) => {
    doc.rect(left, yy - 4, right - left, 18).fill("#F1F8E9");
    doc.fillColor(BRAND).font("Helvetica-Bold").fontSize(8);
    doc.text("Sr", cols.sr + 2, yy);
    doc.text("Description", cols.desc, yy);
    doc.text("HSN", cols.hsn, yy);
    doc.text("Qty", cols.qty, yy);
    doc.text("Unit (excl)", cols.unit, yy, { width: 55, align: "right" });
    doc.text("GST%", cols.gstp, yy);
    doc.text("GST Amt", cols.gsta, yy, { width: 40, align: "right" });
    doc.text("Total", cols.total, yy, { width: 45, align: "right" });
  };
  headerRow(y);
  y += 20;

  // Per-line GST at each line's stored rate (fallback 18% / hsnFor for legacy
  // orders). GROSS pass (no discount) drives the line table; NET pass (with the
  // order discount allocated per line) drives the totals so everything foots.
  const gross = computeLineTaxes(order.lines || [], 0, interState, 18);
  const net = computeLineTaxes(order.lines || [], order.discount || 0, interState, 18);

  let subtotalExcl = gross.taxableExcl;
  const singular = (c) => (c ? String(c).replace(/s$/i, "") : "");
  gross.lines.forEach((l, i) => {
    const inclTotal = l.inclTotal;
    const variant = [l.ram, l.ssd ? `${l.ssd} SSD` : ""].filter(Boolean).join(" | ");
    // "Refurbished [Category] - [Name]" (category from the order line; falls back to
    // "Refurbished - [Name]" when the line has no category).
    const cat = singular(l.category);
    const prefix = cat ? `Refurbished ${cat} - ` : "Refurbished - ";
    // Serial No. matched by productId (or name); shown as a sub-line ("-" if none).
    // The table is too narrow for a dedicated column; the full list also prints below.
    const serial =
      (order.serialNumbers || []).find(
        (s) => (l.productId != null && Number(s.productId) === Number(l.productId)) || (s.productName && s.productName === l.name)
      )?.serialNumber || "";
    const descText = `${prefix}${l.name}${variant ? ` (${variant})` : ""}\nSerial No: ${serial || "-"}`;
    doc.fillColor("#222").font("Helvetica").fontSize(8);
    doc.text(String(i + 1), cols.sr + 2, y);
    doc.text(descText, cols.desc, y, { width: 205 });
    doc.text(l.hsnCode || hsnFor(l.name), cols.hsn, y);
    doc.text(String(l.qty), cols.qty, y);
    doc.text(INR(l.exclUnit), cols.unit, y, { width: 55, align: "right" });
    doc.text(`${l.rate}%`, cols.gstp, y);
    doc.text(INR(l.gstAmount), cols.gsta, y, { width: 40, align: "right" });
    doc.text(INR(inclTotal), cols.total, y, { width: 45, align: "right" });
    y += Math.max(16, doc.heightOfString(descText, { width: 205 }) + 4);
  });

  doc.moveTo(left, y + 2).lineTo(right, y + 2).strokeColor("#ddd").stroke();
  y += 12;

  // ── Device serial numbers ── printed on the LEFT, parallel to the totals block
  // on the right (which draws from the same `y` at x≥330).
  if ((order.serialNumbers || []).length) {
    let sy = y;
    doc.font("Helvetica-Bold").fontSize(9).fillColor("#111").text("Device Serial Numbers:", left, sy, { width: 270 });
    sy += 14;
    doc.font("Helvetica").fontSize(8).fillColor("#333");
    order.serialNumbers.forEach((s, i) => {
      doc.text(`${i + 1}. ${s.productName || "Item"}: ${s.serialNumber || "-"}`, left, sy, { width: 270 });
      sy += 12;
    });
  }

  // ── Totals ── aggregate CGST/SGST/IGST from the per-line net pass.
  const gst = net.gst;
  // Excl-GST portion of an inclusive discount = discount − (tax saved by the discount).
  const taxSaved = gross.totalTax - net.totalTax;
  const discountExcl = order.discount ? Math.round((order.discount || 0) - taxSaved) : 0;
  const delivery = order.delivery || 0;
  // COD: only the upfront (10% + shipping, saved on the order) is paid now; the
  // balance is collected on delivery. Never a flat ₹500.
  const amountPaid = order.codAdvancePaid ? (order.codUpfront ?? 0) : (order.total || 0);
  // Force the statement to foot to the authoritative order.total; a round-off line absorbs sub-rupee drift.
  const computedGrand = subtotalExcl - discountExcl + gst.total + delivery;
  const roundOff = (order.total || 0) - computedGrand;
  // Single store-wide rate now; show the % on the GST rows when the order is uniform.
  const rates = [...new Set((order.lines || []).map((l) => (Number(l.gstRate) > 0 ? Number(l.gstRate) : 18)))];
  const uni = rates.length === 1 ? rates[0] : null;
  const fullPct = uni != null ? ` ${uni}%` : "";
  const halfPct = uni != null ? ` ${+(uni / 2).toFixed(2)}%` : "";
  const rowsR = [
    ["Subtotal (excl GST)", INR(subtotalExcl)],
    ...(order.discount ? [[`Discount${order.couponCode ? ` (${order.couponCode})` : ""} (excl GST)`, "- " + INR(discountExcl)]] : []),
    ...(interState ? [[`IGST${fullPct}`, INR(gst.igst)]] : [[`CGST${halfPct}`, INR(gst.cgst)], [`SGST${halfPct}`, INR(gst.sgst)]]),
    ["Delivery", delivery ? INR(delivery) : "Free"],
    ...(Math.abs(roundOff) >= 1 ? [["Round off", (roundOff < 0 ? "- " : "+ ") + INR(Math.abs(roundOff))]] : []),
  ];
  doc.font("Helvetica").fontSize(9).fillColor("#333");
  rowsR.forEach(([k, v]) => {
    doc.text(k, 330, y, { width: 130 });
    doc.text(v, 460, y, { width: 85, align: "right" });
    y += 15;
  });
  doc.moveTo(330, y).lineTo(right, y).strokeColor("#ddd").stroke();
  y += 6;
  doc.font("Helvetica-Bold").fontSize(11).fillColor(BRAND);
  doc.text("Grand Total (incl GST)", 330, y, { width: 130 });
  doc.text(INR(order.total), 460, y, { width: 85, align: "right" });
  y += 18;
  doc.font("Helvetica").fontSize(9).fillColor("#333");
  doc.text(`Amount Paid: ${INR(amountPaid)}`, 330, y, { width: 215 });
  y += 13;
  doc.text(`Payment Method: ${paymentMethodLabel(order.paymentMethod)}${order.codAdvancePaid ? " (advance paid; balance on delivery)" : ""}`, 330, y, { width: 215 });

  // ── Footer ──
  doc.font("Helvetica").fontSize(8).fillColor("#888");
  doc.text("This is a computer generated invoice.", left, 770);
  doc.text("Goods once sold will not be returned except as per the return policy.", left, 782);
  doc.text("www.refurbishedkart.com", left, 794, { align: "right" });

  doc.end();
  await new Promise((resolve, reject) => { stream.on("finish", resolve); stream.on("error", reject); });

  // Return the AUTHENTICATED download URL (not a raw file path) — the file is private.
  return `/api/invoices/${invoiceNumber}`;
}
