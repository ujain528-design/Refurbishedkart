import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Order } from "@/lib/server/models";
import { getTrackingUrl } from "@/lib/server/shiprocket";
import { sendOrderDispatchedEmail, sendOrderDeliveredEmail } from "@/lib/server/orderEmails";

export const dynamic = "force-dynamic";

/* Shiprocket status webhook. Register at:
   https://refurbishedkart.com/api/delivery/status
   Optional shared-secret: set SHIPROCKET_WEBHOOK_TOKEN and Shiprocket's "x-api-key"
   header must match. If the env var is unset, the endpoint accepts unauthenticated
   posts (fine for testing; set the token before going live). */

// Map a raw Shiprocket status → our order status (null = no order-status change).
function mapStatus(raw) {
  const s = String(raw || "").trim().toUpperCase();
  if (s.includes("DELIVERED")) return "Delivered";
  if (s.includes("PICKED UP") || s === "PICKUP GENERATED") return "Shipped";
  if (s.includes("CANCEL")) return "Cancelled";
  return null; // Courier Assigned / Pickup Scheduled / In Transit / Out for Delivery
}

export async function POST(req) {
  const secret = process.env.SHIPROCKET_WEBHOOK_TOKEN;
  if (secret && req.headers.get("x-api-key") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body = {};
  try { body = await req.json(); } catch { /* tolerate empty/non-JSON */ }

  // Field names vary across account versions — read defensively.
  const awb = String(body.awb || body.awb_code || body.data?.awb || body.data?.awb_code || "");
  const courier = String(body.courier_name || body.courier || body.data?.courier_name || "");
  const rawStatus = body.current_status || body.shipment_status || body.status || body.data?.current_status || "";
  // Our channel order id (we sent order.orderId as order_id) or Shiprocket's order id.
  const orderIdField = String(body.order_id || body.channel_order_id || body.data?.order_id || "");

  try {
    await dbConnect();

    // Resolve the order: by AWB (once assigned), else by our orderId, else by the
    // Shiprocket order id. Needed because at "Courier Assigned" the AWB isn't on the
    // order yet, so we must match on the order id.
    let order = awb ? await Order.findOne({ awbCode: awb }) : null;
    if (!order && orderIdField) order = await Order.findOne({ orderId: orderIdField });
    if (!order && orderIdField) order = await Order.findOne({ shiprocketOrderId: orderIdField });
    if (!order) {
      // eslint-disable-next-line no-console
      console.error(`[shiprocket-webhook] no order (awb=${awb || "-"}, orderId=${orderIdField || "-"}, status=${rawStatus})`);
      return NextResponse.json({ ok: true, note: "order not found" });
    }

    if (rawStatus) order.shiprocketStatus = String(rawStatus);

    // Courier Assigned (or any event that carries a new AWB): save AWB + courier +
    // tracking. Status stays as-is (still "Processing" until actual pickup).
    if (awb && order.awbCode !== awb) {
      order.awbCode = awb;
      order.trackingNumber = awb;
      order.trackingUrl = getTrackingUrl(awb);
      if (courier) { order.courierName = courier; order.courier = courier; }
    } else if (courier && !order.courierName) {
      order.courierName = courier;
      order.courier = courier;
    }

    // Status transitions.
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
      console.error(`[shiprocket-webhook] order ${order.orderId} cancelled by courier (AWB ${awb || "-"}).`);
    }

    await order.save();

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
