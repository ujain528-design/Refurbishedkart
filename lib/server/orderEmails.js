// Customer-facing order status-change emails. One function per status. All emails
// are mobile-responsive HTML with green (#2e7d32) branding and a shared footer.
// These may throw on send failure — callers fire them async and catch/log so a mail
// failure never blocks the status update.
import { mailer } from "./mailer";

const BRAND = "#2e7d32";
const SUPPORT_PHONE = "+91 8448296273";
const SUPPORT_EMAIL = "support@refurbishedkart.com";

const RUPEE = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const orderDate = (d) =>
  new Date(d || Date.now()).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
// Recipient: checkout requires an email, stored on the shipping address.
const emailOf = (order) => order?.email || order?.shippingAddress?.email || "";
// "16GB RAM / 512GB SSD" | "—"
const variantLabel = (l) => {
  const parts = [l?.ram ? `${l.ram}GB RAM` : "", l?.ssd ? `${l.ssd}${/ssd/i.test(String(l.ssd)) ? "" : " SSD"}` : ""].filter(Boolean);
  return parts.join(" / ") || "—";
};
const isCod = (order) => String(order?.paymentMethod || "").toUpperCase() === "COD";

// Simple item list (name · variant · xqty) used across the status emails.
const itemsHtml = (lines = []) =>
  (lines.length ? lines : [])
    .map(
      (l) => `<tr>
        <td style="padding:8px 8px 8px 0;border-bottom:1px solid #eee;font-size:14px;color:#222">${l.name || "—"}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:13px;color:#555">${variantLabel(l)}</td>
        <td style="padding:8px 0 8px 8px;border-bottom:1px solid #eee;font-size:14px;color:#222;text-align:right">×${l.qty || 1}</td>
      </tr>`
    )
    .join("");
const itemsText = (lines = []) => lines.map((l) => `- ${l.name} | ${variantLabel(l)} | x${l.qty || 1}`).join("\n");

// Shared responsive shell: green header with a status headline, body, support footer.
const shell = (headline, bodyHtml) => `<div style="margin:0;padding:0;background:#f4f6f4">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
    <div style="background:${BRAND};padding:22px 24px;text-align:center">
      <div style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:0.5px">RefurbishedKart</div>
      <div style="font-size:15px;color:#d7f5d9;margin-top:4px">${headline}</div>
    </div>
    <div style="padding:24px">
      ${bodyHtml}
      <div style="border-top:1px solid #eee;margin-top:22px;padding-top:16px;font-size:13px;color:#666;line-height:1.7">
        Questions? Call/WhatsApp: <b>${SUPPORT_PHONE}</b><br>
        ${SUPPORT_EMAIL} · Mon–Sat, 11:00 AM – 6:00 PM<br>
        <a href="https://www.refurbishedkart.com" style="color:${BRAND};font-weight:600">www.refurbishedkart.com</a>
      </div>
    </div>
  </div>
</div>`;

const itemsTable = (lines) =>
  `<table role="presentation" width="100%" style="border-collapse:collapse;margin:0 0 18px">${itemsHtml(lines)}</table>`;

const send = (order, subject, headline, bodyHtml, textBody) => {
  const to = emailOf(order);
  if (!to) return null;
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  return mailer().sendMail({ from, to, subject, text: textBody, html: shell(headline, bodyHtml) });
};

const greeting = (order) => {
  const name = order?.customerName || order?.shippingAddress?.name || "there";
  return `<p style="font-size:15px;color:#222;margin:0 0 16px">Hi ${name},</p>`;
};

const orderMeta = (order) =>
  `<p style="font-size:14px;color:#555;margin:0 0 16px">Order <b style="color:#222">#${order.orderId}</b> · ${orderDate(order.createdAt)}</p>`;

/* 1. Cancelled — reason + refund handling by how the order was paid. */
export async function sendOrderCancelledEmail(order = {}) {
  const cod = isCod(order);
  const paidOnline = !cod && (order.paidAt || order.razorpayPaymentId);
  const codPaid = cod && (order.codAdvancePaid || order.paidAt || order.razorpayPaymentId);
  let refundLine;
  if (paidOnline) refundLine = `Refund of <b>${RUPEE(order.total)}</b> will be credited to your original payment method within 5–7 business days.`;
  else if (codPaid) refundLine = `Refund of <b>${RUPEE(order.codUpfront)}</b> (upfront amount) will be processed within 5–7 business days.`;
  else refundLine = "No payment was collected for this order.";

  const body = `${greeting(order)}${orderMeta(order)}
    <p style="font-size:14px;color:#333;margin:0 0 12px">Your order has been cancelled.</p>
    ${order.cancellationReason ? `<p style="font-size:14px;color:#333;margin:0 0 12px"><b>Reason:</b> ${order.cancellationReason}</p>` : ""}
    <p style="font-size:13px;font-weight:700;color:${BRAND};text-transform:uppercase;letter-spacing:0.5px;margin:0 0 6px">Items</p>
    ${itemsTable(order.lines)}
    <div style="background:#f7faf7;border-radius:8px;padding:12px 14px;font-size:14px;color:#333">${refundLine}</div>`;
  const text = [
    `Order Cancelled - #${order.orderId}`, orderDate(order.createdAt), "",
    itemsText(order.lines), "",
    order.cancellationReason ? `Reason: ${order.cancellationReason}` : "",
    refundLine.replace(/<[^>]+>/g, ""), "",
    `Questions? ${SUPPORT_PHONE} · ${SUPPORT_EMAIL}`,
  ].filter(Boolean).join("\n");
  return send(order, `Order Cancelled - #${order.orderId} | RefurbishedKart`, "Order Cancelled", body, text);
}

/* 2. Packed. */
export async function sendOrderPackedEmail(order = {}) {
  const body = `${greeting(order)}${orderMeta(order)}
    <p style="font-size:14px;color:#333;margin:0 0 12px">Your order is being carefully packed and will be dispatched soon.</p>
    <p style="font-size:13px;font-weight:700;color:${BRAND};text-transform:uppercase;letter-spacing:0.5px;margin:0 0 6px">Items being packed</p>
    ${itemsTable(order.lines)}
    <div style="background:#f7faf7;border-radius:8px;padding:12px 14px;font-size:14px;color:#333">Estimated dispatch: within 1–2 business days.</div>`;
  const text = [
    `Your Order is Being Packed - #${order.orderId}`, orderDate(order.createdAt), "",
    "Your order is being carefully packed and will be dispatched soon.",
    "Estimated dispatch: within 1–2 business days.", "",
    itemsText(order.lines), "",
    `Questions? ${SUPPORT_PHONE} · ${SUPPORT_EMAIL}`,
  ].filter(Boolean).join("\n");
  return send(order, `Your Order is Being Packed - #${order.orderId} | RefurbishedKart`, "Order Being Packed", body, text);
}

/* 3. Dispatched / Shipped — tracking details + address reminder. */
export async function sendOrderDispatchedEmail(order = {}) {
  const courier = order.courierName || order.courier || "";
  const tn = order.trackingNumber || "";
  const url = order.trackingUrl || "";
  const trackingHtml = url
    ? `<a href="${url}" style="color:${BRAND};font-weight:700">Track your shipment</a>${tn ? ` (Tracking #: <b>${tn}</b>)` : ""}`
    : tn
      ? `Use tracking number <b>${tn}</b>${courier ? ` on the ${courier} website` : " on the courier partner website"}.`
      : "Tracking details will be shared shortly.";
  const addr = order.shippingAddress || {};
  const addrHtml = [addr.name, [addr.line1, addr.line2].filter(Boolean).join(", "), [addr.city, addr.state, addr.pincode].filter(Boolean).join(", ")]
    .filter(Boolean).map((l) => `<div style="font-size:13px;color:#555;line-height:1.5">${l}</div>`).join("");

  const body = `${greeting(order)}${orderMeta(order)}
    <p style="font-size:14px;color:#333;margin:0 0 12px">Good news — your order is on the way!</p>
    <p style="font-size:13px;font-weight:700;color:${BRAND};text-transform:uppercase;letter-spacing:0.5px;margin:0 0 6px">Items dispatched</p>
    ${itemsTable(order.lines)}
    <div style="background:#f7faf7;border-radius:8px;padding:14px 16px;font-size:14px;color:#333;margin:0 0 16px">
      ${courier ? `<div style="margin-bottom:4px"><b>Courier:</b> ${courier}</div>` : ""}
      <div>${trackingHtml}</div>
      <div style="margin-top:6px;color:#555">Estimated delivery: 3–7 business days.</div>
    </div>
    <p style="font-size:13px;font-weight:700;color:${BRAND};text-transform:uppercase;letter-spacing:0.5px;margin:0 0 6px">Delivery address</p>
    ${addrHtml || '<div style="font-size:13px;color:#999">—</div>'}`;
  const text = [
    `Your Order is On the Way! - #${order.orderId}`, orderDate(order.createdAt), "",
    itemsText(order.lines), "",
    courier ? `Courier: ${courier}` : "",
    tn ? `Tracking number: ${tn}` : "",
    url ? `Tracking link: ${url}` : (tn ? "Use the tracking number on the courier partner website." : ""),
    "Estimated delivery: 3–7 business days.", "",
    `Questions? ${SUPPORT_PHONE} · ${SUPPORT_EMAIL}`,
  ].filter(Boolean).join("\n");
  return send(order, `Your Order is On the Way! #${order.orderId} | RefurbishedKart`, "Your Order is On the Way!", body, text);
}

/* 4. Delivered — return window + review nudge. */
export async function sendOrderDeliveredEmail(order = {}) {
  const body = `${greeting(order)}${orderMeta(order)}
    <p style="font-size:15px;color:#222;font-weight:700;margin:0 0 12px">Your order has been delivered! 🎉</p>
    <p style="font-size:14px;color:#333;margin:0 0 12px">We hope you love your device.</p>
    <p style="font-size:13px;font-weight:700;color:${BRAND};text-transform:uppercase;letter-spacing:0.5px;margin:0 0 6px">Items delivered</p>
    ${itemsTable(order.lines)}
    <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:12px 14px;font-size:14px;color:#8d6e00;margin:0 0 14px">
      <b>Remember:</b> a 7-day return window applies from today. If you have any issues, contact us within 7 days.
    </div>
    <p style="font-size:14px;color:#333;margin:0">Enjoying your purchase? We'd love to hear from you.</p>`;
  const text = [
    `Order Delivered - #${order.orderId}`, orderDate(order.createdAt), "",
    "Your order has been delivered! We hope you love your device.", "",
    itemsText(order.lines), "",
    "Remember: a 7-day return window applies from today. If you have any issues, contact us within 7 days.",
    "Enjoying your purchase? We'd love to hear from you.", "",
    `Questions? ${SUPPORT_PHONE} · ${SUPPORT_EMAIL}`,
  ].filter(Boolean).join("\n");
  return send(order, `Order Delivered - #${order.orderId} | RefurbishedKart`, "Order Delivered", body, text);
}

/* 5. Refunded — amount + method. */
export async function sendOrderRefundedEmail(order = {}, refundAmount) {
  const amount = refundAmount != null ? refundAmount : order.refundAmount;
  const body = `${greeting(order)}${orderMeta(order)}
    <p style="font-size:14px;color:#333;margin:0 0 12px">Your refund of <b>${RUPEE(amount)}</b> has been processed.</p>
    <div style="background:#f7faf7;border-radius:8px;padding:12px 14px;font-size:14px;color:#333">
      It will be credited to your original payment method within 5–7 business days.
    </div>`;
  const text = [
    `Refund Processed - #${order.orderId}`, orderDate(order.createdAt), "",
    `Refund amount: ${RUPEE(amount)}`,
    "Your refund has been processed and will be credited to your original payment method within 5–7 business days.", "",
    `Questions? ${SUPPORT_PHONE} · ${SUPPORT_EMAIL}`,
  ].join("\n");
  return send(order, `Refund Processed - #${order.orderId} | RefurbishedKart`, "Refund Processed", body, text);
}
