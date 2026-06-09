import fs from "fs";
import { dbConnect } from "@/lib/server/mongoose";
import { Order } from "@/lib/server/models";
import { userFromRequest } from "@/lib/server/jwt";
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
  const auth = userFromRequest(req);
  if (!auth) return Response.json({ error: "Login required" }, { status: 401 });

  const { orderId } = params;
  await dbConnect();
  const order = await Order.findOne({ orderId }).lean();
  log("[invoice] download request:", orderId, "order found:", !!order);
  if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

  const isAdmin = auth.role === "admin" || auth.role === "superadmin";
  if (!isAdmin && order.userId !== auth.sub) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const invoiceNumber = order.invoiceNumber || order.orderId;
  let filePath = invoiceFilePath(invoiceNumber);
  log("[invoice] looking for file:", filePath, "exists:", fs.existsSync(filePath));

  // Lazily (re)generate if the PDF is missing — e.g. orders placed before the
  // invoice feature, or a file lost on redeploy. Never block on failure.
  if (!fs.existsSync(filePath)) {
    try {
      log("[invoice] file missing — regenerating for", invoiceNumber);
      await generateInvoice(order);
      log("[invoice] regeneration done, exists now:", fs.existsSync(filePath));
    } catch (e) {
      logError("[invoice] (re)generation FAILED:", e.message, e.stack);
    }
    if (!fs.existsSync(filePath)) {
      return Response.json({ error: "Invoice not available" }, { status: 404 });
    }
  }

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
