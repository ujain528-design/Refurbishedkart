import fs from "fs";
import { dbConnect } from "@/lib/server/mongoose";
import { Order } from "@/lib/server/models";
import { userFromRequest } from "@/lib/server/jwt";
import { requireAdmin } from "@/lib/server/adminAuth";
import { invoiceFilePath, generateInvoice } from "@/lib/server/invoiceGenerator";
import { log, logError } from "@/lib/logger";

export const dynamic = "force-dynamic";

/* GET /api/invoices/[orderId]
   Streams a customer's private GST invoice PDF. Access control:
     - must be authenticated (valid JWT)
     - admin / superadmin → any order
     - customer → only their own orders (order.userId === auth.sub)
   404 if the order doesn't exist; 403 if it belongs to someone else. */
export async function GET(req, { params }) {
  const { orderId } = params;
  await dbConnect();
  const order = await Order.findOne({ orderId }).lean();
  log("[invoice] download request:", orderId, "order found:", !!order);
  if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

  // Authorize by EITHER a customer Bearer token (must own the order) OR the admin
  // session cookie — so both the customer "Download Invoice" and the admin
  // "Download Invoice" (a cookie-authenticated fetch) can stream the same PDF.
  const auth = userFromRequest(req);
  let isAdmin = auth?.role === "admin" || auth?.role === "superadmin";
  if (!isAdmin) { const { error } = requireAdmin(req); if (!error) isAdmin = true; }
  const owns = auth && order.userId === auth.sub;
  if (!isAdmin && !owns) {
    return Response.json({ error: auth ? "Forbidden" : "Login required" }, { status: auth ? 403 : 401 });
  }

  const invoiceNumber = order.invoiceNumber || order.orderId;
  const filePath = invoiceFilePath(invoiceNumber);

  // ALWAYS regenerate from the current order so the PDF reflects the latest data
  // (e.g. serial numbers added after shipping). The old "only if missing" cache
  // served stale invoices to existing orders. On a generation error, fall back to
  // any previously-cached file rather than failing the download.
  try {
    await generateInvoice(order);
  } catch (e) {
    logError("[invoice] generation FAILED:", e.message, e.stack);
  }
  if (!fs.existsSync(filePath)) {
    return Response.json({ error: "Invoice not available" }, { status: 404 });
  }
  log("[invoice] serving:", filePath);

  const buffer = await fs.promises.readFile(filePath);
  return new Response(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoiceNumber}.pdf"`,
      "Content-Length": String(buffer.length),
      "Cache-Control": "private, no-store",
    },
  });
}
