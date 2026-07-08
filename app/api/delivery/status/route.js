import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Order } from "@/lib/server/models";
import { sendOrderDispatchedEmail, sendOrderDeliveredEmail } from "@/lib/server/orderEmails";

export const dynamic = "force-dynamic";

/* Shiprocket status webhook. Register at:
   https://refurbishedkart.com/api/delivery/status
   Optional shared-secret: set SHIPROCKET_WEBHOOK_TOKEN and Shiprocket's "x-api-key"
   header must match. If the env var is unset, the endpoint accepts unauthenticated
   posts (fine for testing; set the token before going live). */

// Map a raw Shiprocket status → our order status (or null = no order-status change).
function mapStatus(raw) {
  const s = String(raw || "").trim().toUpperCase();
  if (s.includes("DELIVERED")) return "Delivered";
  if (s.includes("PICKED UP") || s === "PICKUP GENERATED") return "Shipped";
  if (s.includes("CANCEL")) return "Cancelled";
  return null; // Pickup Scheduled / In Transit / Out for Delivery → status unchanged
}

export async function POST(req) {
  // Optional shared-secret check.
  const secret = process.env.SHIPROCKET_WEBHOOK_TOKEN;
  if (secret && req.headers.get("x-api-key") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body = {};
  try { body = await req.json(); } catch { /* tolerate empty/non-JSON */ }

  // Shiprocket posts a single shipment; field names vary across account versions.
  const awb = body.awb || body.awb_code || body.data?.awb || body.data?.awb_code || "";
  const rawStatus = body.current_status || body.shipment_status || body.status || body.data?.current_status || "";

  if (!awb) {
    // Nothing to correlate — acknowledge so Shiprocket doesn't retry forever.
    // eslint-disable-next-line no-console
    console.error("[shiprocket-webhook] no AWB in payload:", JSON.stringify(body).slice(0, 500));
    return NextResponse.json({ ok: true, note: "no awb" });
  }

  try {
    await dbConnect();
    const order = await Order.findOne({ awbCode: String(awb) });
    if (!order) {
      // eslint-disable-next-line no-console
      console.error(`[shiprocket-webhook] no order for AWB ${awb} (status ${rawStatus})`);
      return NextResponse.json({ ok: true, note: "order not found" });
    }

    order.shiprocketStatus = String(rawStatus || "");
    const next = mapStatus(rawStatus);
    let fire = null;

    if (next === "Shipped" && order.status !== "Shipped" && order.status !== "Delivered") {
      order.status = "Shipped";
      fire = () => sendOrderDispatchedEmail(order.toObject());
    } else if (next === "Delivered" && order.status !== "Delivered") {
      order.status = "Delivered";
      if (!order.deliveredAt) order.deliveredAt = new Date(); // return-window base
      fire = () => sendOrderDeliveredEmail(order.toObject());
    } else if (next === "Cancelled" && order.status !== "Cancelled") {
      order.status = "Cancelled";
      if (!order.cancellationReason) order.cancellationReason = "Cancelled by courier (Shiprocket)";
      // eslint-disable-next-line no-console
      console.error(`[shiprocket-webhook] order ${order.orderId} cancelled by courier (AWB ${awb}).`);
    }

    await order.save();

    // Customer email (async, non-blocking) on the meaningful transitions.
    if (fire) {
      const p = fire();
      if (p && typeof p.catch === "function") {
        // eslint-disable-next-line no-console
        p.catch((err) => console.error(`[shiprocket-webhook] email failed for ${order.orderId}:`, err.message));
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[shiprocket-webhook] handler error:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
