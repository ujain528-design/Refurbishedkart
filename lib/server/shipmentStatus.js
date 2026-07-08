import { getTrackingUrl } from "./shiprocket";
import { sendOrderDispatchedEmail, sendOrderDeliveredEmail } from "./orderEmails";

/* Apply a Shiprocket status update to an order document (mutates in place). Shared by
   the webhook and the manual "Sync from Shiprocket" route so both behave identically.
   Returns { event, fire } — `event` labels the matched transition (for logging) and
   `fire` (or null) sends the customer email for a meaningful transition. Caller saves
   the order and invokes fire() async. */
export function applyShipmentUpdate(order, { awb = "", courier = "", rawStatus = "" } = {}) {
  if (rawStatus) order.shiprocketStatus = rawStatus;

  const applyAwb = () => {
    if (awb && order.awbCode !== awb) {
      order.awbCode = awb;
      order.trackingNumber = awb;
      order.trackingUrl = getTrackingUrl(awb);
    }
    if (courier && order.courierName !== courier) {
      order.courierName = courier;
      order.courier = courier;
    }
  };

  const S = String(rawStatus || "").trim().toUpperCase();
  let event = "info";
  let fire = null;

  // Priority: RTO/Cancelled first (so "RTO Delivered" isn't read as a customer
  // delivery); "Out for Delivery" doesn't contain "DELIVERED".
  if (S.includes("CANCEL") || S.includes("RTO")) {
    if (order.status !== "Cancelled") {
      order.status = "Cancelled";
      if (!order.cancellationReason) order.cancellationReason = "Cancelled by courier/RTO";
    }
    event = "cancelled";
  } else if (S.includes("DELIVERED")) {
    applyAwb();
    if (order.status !== "Delivered") {
      order.status = "Delivered";
      if (!order.deliveredAt) order.deliveredAt = new Date(); // return-window base
      fire = () => sendOrderDeliveredEmail(order.toObject());
    }
    event = "delivered";
  } else if (S.includes("PICKED UP") || S === "PICKUP GENERATED") {
    applyAwb();
    if (order.status !== "Shipped") {
      order.status = "Shipped";
      fire = () => sendOrderDispatchedEmail(order.toObject());
    }
    event = "picked_up";
  } else if (S.includes("AWB ASSIGNED") || S.includes("COURIER ASSIGNED")) {
    applyAwb();
    event = "awb_assigned";
  } else if (S.includes("OUT FOR DELIVERY")) {
    event = "out_for_delivery";
  } else {
    // In Transit / Pickup Scheduled / unknown — refresh AWB, no status change.
    applyAwb();
    event = "info";
  }

  return { event, fire };
}
