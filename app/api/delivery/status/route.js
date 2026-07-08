import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Order } from "@/lib/server/models";
import { applyShipmentUpdate } from "@/lib/server/shipmentStatus";

export const dynamic = "force-dynamic";

/* Shiprocket status webhook. Register at:
   https://refurbishedkart.com/api/delivery/status

   The AWB can change on courier re-assignment, so the order is matched on the STABLE
   Shiprocket identifiers first (our order_id / shipment id), with awb only as a last
   resort.

   Response codes:
     200 — expected non-events (unknown order, bad/empty payload, unknown status) so
           Shiprocket does NOT retry them.
     500 — real server failures (DB connect / write / unexpected) so Shiprocket DOES
           retry and we don't silently lose a real status update.
     401 — failed x-api-key check (when SHIPROCKET_WEBHOOK_TOKEN is set).

   Optional shared-secret: set SHIPROCKET_WEBHOOK_TOKEN; then Shiprocket's "x-api-key"
   header must match. Unset ⇒ endpoint accepts unauthenticated posts (testing only). */

// eslint-disable-next-line no-console
const log = (...a) => console.log("[webhook]", ...a);

export async function POST(req) {
  const secret = process.env.SHIPROCKET_WEBHOOK_TOKEN;
  if (secret && req.headers.get("x-api-key") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse payload — a bad/empty body is an expected non-event (200), not a 500.
  let body = {};
  try { body = await req.json(); } catch { /* tolerate empty/non-JSON */ }

  // Field names vary across Shiprocket account versions — read defensively.
  const awb = String(body.awb || body.awb_code || body.data?.awb || "");
  const courier = String(body.courier_name || body.courier || body.data?.courier_name || "");
  const rawStatus = String(body.current_status || body.shipment_status || body.status || body.data?.current_status || "");
  const shipmentId = String(body.shipment_id || body.data?.shipment_id || "");
  const orderIdField = String(body.order_id || body.channel_order_id || body.data?.order_id || "");

  try {
    await dbConnect();

    // Resolve the order. Prefer our own order id, then the Shiprocket shipment id
    // (stable), then the AWB (may change on re-assignment).
    let order = null;
    if (orderIdField) order = await Order.findOne({ orderId: orderIdField });
    if (!order && shipmentId) order = await Order.findOne({ shiprocketShipmentId: shipmentId });
    if (!order && shipmentId) order = await Order.findOne({ shiprocketOrderId: shipmentId });
    if (!order && awb) order = await Order.findOne({ awbCode: awb });

    if (!order) {
      // Unknown order = expected non-event → 200 (no retry).
      log(`no order found (order_id=${orderIdField || "-"}, shipment_id=${shipmentId || "-"}, awb=${awb || "-"}, status=${rawStatus})`);
      return NextResponse.json({ ok: true, note: "order not found" });
    }

    const { event, fire } = applyShipmentUpdate(order, { awb, courier, rawStatus });
    await order.save();

    if (event === "cancelled") log(`order ${order.orderId} cancelled/RTO`);
    else if (event === "delivered") log(`order ${order.orderId} delivered`);
    else if (event === "picked_up") log(`order ${order.orderId} picked up`);
    else if (event === "awb_assigned") log(`AWB assigned: ${order.awbCode || awb || "-"} (${order.orderId})`);
    else if (event === "out_for_delivery") log(`order ${order.orderId} out for delivery`);

    if (fire) {
      const p = fire();
      if (p && typeof p.catch === "function") {
        // eslint-disable-next-line no-console
        p.catch((err) => console.log("[webhook] email failed for", order.orderId, ":", err.message));
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    // Real server failure (DB connect/write/unexpected) → 500 so Shiprocket retries.
    log("handler error (will retry):", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
