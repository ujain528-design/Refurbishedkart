// Nodemailer transport over Gmail SMTP (STARTTLS on 587). Used to deliver OTP
// codes. The Gmail app password lives in EMAIL_PASS (.env.local, gitignored).
import nodemailer from "nodemailer";

let cachedTransport = globalThis._rkMailer;

export function mailer() {
  if (cachedTransport) return cachedTransport;
  const port = Number(process.env.EMAIL_PORT || 587);
  cachedTransport = globalThis._rkMailer = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port,
    secure: port === 465, // 465 = implicit TLS; 587 = STARTTLS
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  return cachedTransport;
}

export async function sendOtpEmail(to, code) {
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  return mailer().sendMail({
    from,
    to,
    subject: `${code} is your RefurbishedKart verification code`,
    text: `Your RefurbishedKart OTP is ${code}. It expires in 5 minutes.`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:420px">
      <h2 style="color:#1B5E20;margin:0 0 8px">RefurbishedKart</h2>
      <p style="font-size:14px;color:#444">Your verification code is:</p>
      <p style="font-size:30px;font-weight:800;letter-spacing:6px;color:#111;margin:8px 0">${code}</p>
      <p style="font-size:12px;color:#888">Expires in 5 minutes. If you didn't request this, ignore this email.</p>
    </div>`,
  });
}

/* Admin credential-change OTP (10-minute validity). */
export async function sendAdminOtpEmail(to, code) {
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  return mailer().sendMail({
    from,
    to,
    subject: `${code} — RefurbishedKart admin credential change`,
    text: `Your admin credential-change OTP is ${code}. It expires in 10 minutes. If you didn't request this, secure your account immediately.`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:440px">
      <h2 style="color:#1B5E20;margin:0 0 8px">RefurbishedKart Admin</h2>
      <p style="font-size:14px;color:#444">Use this code to change your admin credentials:</p>
      <p style="font-size:30px;font-weight:800;letter-spacing:6px;color:#111;margin:8px 0">${code}</p>
      <p style="font-size:12px;color:#888">Expires in 10 minutes. If you didn't request this, secure your account immediately.</p>
    </div>`,
  });
}

const INR = (n) => "Rs. " + Number(n || 0).toLocaleString("en-IN");
const wrap = (inner) =>
  `<div style="font-family:system-ui,sans-serif;max-width:480px">
     <h2 style="color:#1B5E20;margin:0 0 12px">RefurbishedKart</h2>
     ${inner}
     <p style="font-size:12px;color:#888;margin-top:18px">RefurbishedKart · Certified refurbished tech</p>
   </div>`;

/* Return lifecycle emails. `kind` is one of:
   "requested" | "approved" | "rejected" | "refunded".
   `data` carries the fields each template needs. No-throw: callers should not let a
   mail failure break the request, so wrap calls in try/catch. */
export async function sendReturnEmail(to, kind, data = {}) {
  if (!to) return null;
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const { returnId, productName, refundAmount, reason, orderNumber, customerName, whatsappNumber } = data;
  const orderRef = orderNumber || returnId;

  let subject = "";
  let body = "";
  if (kind === "requested") {
    subject = `Return Request Received - Order #${orderRef}`;
    body = `<p style="font-size:14px;color:#333">Hi ${customerName || "there"},</p>
      <p style="font-size:14px;color:#333">We have received your return request for Order <b>#${orderRef}</b>${productName ? ` (${productName})` : ""}.</p>
      <p style="font-size:14px;color:#333"><b>What happens next:</b></p>
      <ol style="font-size:14px;color:#333;padding-left:18px;margin:6px 0">
        <li>Our team will review your request within 2 business days.</li>
        <li>We will check the unboxing video you sent on WhatsApp.</li>
        <li>You will receive an email with our decision.</li>
      </ol>
      <p style="font-size:14px;color:#333"><b>Return request details</b><br>Reason: ${reason || "—"}<br>WhatsApp used: ${whatsappNumber || "—"}</p>
      <p style="font-size:13px;color:#666">Questions? Contact us: +91 8448296273 (Mon–Sat, 11AM–6PM) · support@refurbishedkart.com</p>`;
  } else if (kind === "approved") {
    subject = `Return Approved - Order #${orderRef}`;
    body = `<p style="font-size:14px;color:#333">Hi ${customerName || "there"},</p>
      <p style="font-size:14px;color:#333">Great news! Your return request for Order <b>#${orderRef}</b> has been approved.</p>
      <p style="font-size:14px;color:#333"><b>What happens next:</b><br>Our team will arrange a pickup from your delivery address within 2–3 business days. Please ensure the device is packed securely in its original packaging.</p>
      <p style="font-size:14px;color:#333">Keep your device ready for pickup.</p>
      <p style="font-size:13px;color:#666">Questions? +91 8448296273 (Mon–Sat, 11AM–6PM)</p>`;
  } else if (kind === "rejected") {
    subject = `Return Request Update - Order #${orderRef}`;
    body = `<p style="font-size:14px;color:#333">Hi ${customerName || "there"},</p>
      <p style="font-size:14px;color:#333">We have reviewed your return request for Order <b>#${orderRef}</b>. Unfortunately, we are unable to process your return at this time.</p>
      ${reason ? `<p style="font-size:14px;color:#333">Reason: <b>${reason}</b></p>` : ""}
      <p style="font-size:13px;color:#666">If you have questions, please contact us:<br>+91 8448296273 (Mon–Sat, 11AM–6PM) · support@refurbishedkart.com</p>`;
  } else if (kind === "refunded") {
    subject = `Refund Processed - Order #${orderRef}`;
    body = `<p style="font-size:14px;color:#333">Hi ${customerName || "there"},</p>
      <p style="font-size:14px;color:#333">Your refund of <b>${INR(refundAmount)}</b> for Order <b>#${orderRef}</b> has been processed.</p>
      <p style="font-size:14px;color:#333">The amount will be credited to your original payment method within 5–7 business days.</p>
      <p style="font-size:13px;color:#666">Thank you for shopping with RefurbishedKart.</p>`;
  } else {
    return null;
  }

  return mailer().sendMail({ from, to, subject, text: body.replace(/<[^>]+>/g, " "), html: wrap(body) });
}

const SUPPORT_EMAIL = "support@refurbishedkart.com";

// ₹ formatter for order emails (the older INR helper prints "Rs.").
const RUPEE = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
// "1 July 2026" in IST (server may run in UTC, so pin the zone).
const orderDate = (d) =>
  new Date(d || Date.now()).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
// "16GB / 512GB SSD" | "—" — ssd already carries its unit, ram is a GB number.
const variantLabel = (l) => {
  const parts = [l?.ram ? `${l.ram}GB RAM` : "", l?.ssd ? `${l.ssd}${/ssd/i.test(String(l.ssd)) ? "" : " SSD"}` : ""].filter(Boolean);
  return parts.join(" / ") || "—";
};

/* Customer order-confirmation email (mobile-responsive HTML, green branding).
   `to` is the customer's email; `order` is the saved order document (plain object).
   Throws on send failure — the caller decides whether that blocks anything. */
export async function sendOrderConfirmationEmail(to, order = {}) {
  if (!to) return null;
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const lines = order.lines || [];
  const isCod = String(order.paymentMethod || "").toUpperCase() === "COD";
  const addr = order.shippingAddress || {};
  const customerName = order.customerName || addr.name || "there";
  const deliveryLabel = Number(order.delivery) > 0 ? RUPEE(order.delivery) : "FREE";

  const itemRows = lines
    .map(
      (l) => `<tr>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;font-size:14px;color:#222">${l.name || "—"}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;font-size:13px;color:#555">${variantLabel(l)}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;font-size:14px;color:#222;text-align:center">${l.qty || 1}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;font-size:14px;color:#222;text-align:right;white-space:nowrap">${RUPEE((Number(l.unitPrice) || 0) * (Number(l.qty) || 1))}</td>
      </tr>`
    )
    .join("");

  const breakdown = [
    `<tr><td style="padding:3px 0;font-size:14px;color:#555">Subtotal</td><td style="padding:3px 0;font-size:14px;color:#222;text-align:right">${RUPEE(order.subtotal)}</td></tr>`,
    Number(order.discount) > 0
      ? `<tr><td style="padding:3px 0;font-size:14px;color:#2e7d32">Coupon${order.couponCode ? ` (${order.couponCode})` : ""}</td><td style="padding:3px 0;font-size:14px;color:#2e7d32;text-align:right">− ${RUPEE(order.discount)}</td></tr>`
      : "",
    `<tr><td style="padding:3px 0;font-size:14px;color:#555">Shipping</td><td style="padding:3px 0;font-size:14px;color:#222;text-align:right">${deliveryLabel}</td></tr>`,
    `<tr><td style="padding:8px 0 0;border-top:2px solid #2e7d32;font-size:16px;font-weight:700;color:#222">Total</td><td style="padding:8px 0 0;border-top:2px solid #2e7d32;font-size:16px;font-weight:700;color:#222;text-align:right">${RUPEE(order.total)}</td></tr>`,
    isCod
      ? `<tr><td colspan="2" style="padding:10px 0 0"><div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:10px 12px;font-size:13px;color:#8d6e00">
           <b>Paid now (10% upfront):</b> ${RUPEE(order.codUpfront)}<br><b>To pay at delivery:</b> ${RUPEE(order.codRemaining)}
         </div></td></tr>`
      : "",
  ].join("");

  const addressBlock = [addr.name, [addr.line1, addr.line2].filter(Boolean).join(", "), [addr.city, addr.state].filter(Boolean).join(", "), addr.pincode ? `PIN ${addr.pincode}` : "", addr.phone ? `Phone: ${addr.phone}` : ""]
    .filter(Boolean)
    .map((l) => `<div style="font-size:14px;color:#333;line-height:1.5">${l}</div>`)
    .join("");

  const html = `<div style="margin:0;padding:0;background:#f4f6f4">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
      <div style="background:#2e7d32;padding:22px 24px;text-align:center">
        <div style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:0.5px">RefurbishedKart</div>
        <div style="font-size:15px;color:#d7f5d9;margin-top:4px">Order Confirmed ✓</div>
      </div>
      <div style="padding:24px">
        <p style="font-size:15px;color:#222;margin:0 0 16px">Hi ${customerName}, thank you for your order!</p>

        <table role="presentation" width="100%" style="border-collapse:collapse;background:#f7faf7;border-radius:8px;margin-bottom:20px">
          <tr><td style="padding:12px 14px;font-size:14px;color:#555">Order Number</td><td style="padding:12px 14px;font-size:14px;color:#222;font-weight:700;text-align:right">#${order.orderId || "—"}</td></tr>
          <tr><td style="padding:0 14px 12px;font-size:14px;color:#555">Order Date</td><td style="padding:0 14px 12px;font-size:14px;color:#222;text-align:right">${orderDate(order.createdAt)}</td></tr>
          <tr><td style="padding:0 14px 12px;font-size:14px;color:#555">Payment Method</td><td style="padding:0 14px 12px;font-size:14px;color:#222;text-align:right">${isCod ? "Cash on Delivery" : "Online Payment"}</td></tr>
        </table>

        <table role="presentation" width="100%" style="border-collapse:collapse;margin-bottom:20px">
          <thead><tr style="background:#2e7d32">
            <th style="padding:8px;font-size:12px;color:#fff;text-align:left">Product</th>
            <th style="padding:8px;font-size:12px;color:#fff;text-align:left">Variant</th>
            <th style="padding:8px;font-size:12px;color:#fff;text-align:center">Qty</th>
            <th style="padding:8px;font-size:12px;color:#fff;text-align:right">Price</th>
          </tr></thead>
          <tbody>${itemRows}</tbody>
        </table>

        <table role="presentation" width="100%" style="border-collapse:collapse;margin-bottom:22px">${breakdown}</table>

        <div style="margin-bottom:22px">
          <div style="font-size:13px;font-weight:700;color:#2e7d32;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">Delivery Address</div>
          ${addressBlock || '<div style="font-size:14px;color:#999">—</div>'}
        </div>

        <div style="background:#f7faf7;border-radius:8px;padding:16px 18px;margin-bottom:22px">
          <div style="font-size:13px;font-weight:700;color:#2e7d32;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">What happens next</div>
          <ul style="margin:0;padding-left:18px;font-size:14px;color:#444;line-height:1.7">
            <li>Your order will be dispatched within 1–2 business days.</li>
            <li>Tracking details will be shared on WhatsApp/email once dispatched.</li>
            <li>Estimated delivery: 3–7 business days.</li>
            <li>For returns/issues: 7-day return window from delivery.</li>
          </ul>
        </div>

        <div style="border-top:1px solid #eee;padding-top:16px;font-size:13px;color:#666;line-height:1.7">
          Questions? Call/WhatsApp: <b>+91 8448296273</b><br>
          support@refurbishedkart.com · Mon–Sat, 11:00 AM – 6:00 PM<br>
          <a href="https://www.refurbishedkart.com" style="color:#2e7d32;font-weight:600">www.refurbishedkart.com</a>
        </div>
      </div>
    </div>
  </div>`;

  const text = [
    `Order Confirmed - #${order.orderId}`,
    `Hi ${customerName}, thank you for your order!`,
    `Date: ${orderDate(order.createdAt)} · Payment: ${isCod ? "Cash on Delivery" : "Online Payment"}`,
    "",
    ...lines.map((l) => `- ${l.name} | ${variantLabel(l)} | x${l.qty || 1} | ${RUPEE((Number(l.unitPrice) || 0) * (Number(l.qty) || 1))}`),
    "",
    `Subtotal: ${RUPEE(order.subtotal)}`,
    Number(order.discount) > 0 ? `Coupon${order.couponCode ? ` (${order.couponCode})` : ""}: -${RUPEE(order.discount)}` : "",
    `Shipping: ${deliveryLabel}`,
    `Total: ${RUPEE(order.total)}`,
    isCod ? `Paid now (10% upfront): ${RUPEE(order.codUpfront)}\nTo pay at delivery: ${RUPEE(order.codRemaining)}` : "",
    "",
    "Questions? +91 8448296273 · support@refurbishedkart.com (Mon–Sat, 11AM–6PM)",
  ]
    .filter(Boolean)
    .join("\n");

  return mailer().sendMail({ from, to, subject: `Order Confirmed #${order.orderId} | RefurbishedKart`, text, html });
}

/* Admin new-order notification (simple). `to` is process.env.ADMIN_EMAIL. `extra`
   carries customerEmail / phone / whatsappOptIn that aren't on the order doc alone.
   Throws on send failure — caller decides. Returns null if no admin address set. */
export async function sendOrderAdminNotification(order = {}, extra = {}) {
  const to = process.env.ADMIN_EMAIL;
  if (!to) return null;
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const lines = order.lines || [];
  const isCod = String(order.paymentMethod || "").toUpperCase() === "COD";
  const addr = order.shippingAddress || {};
  const paymentLabel = isCod ? "COD" : "Online";
  const itemsText = lines.map((l) => `  - ${l.name} | ${variantLabel(l)} | x${l.qty || 1} | ${RUPEE((Number(l.unitPrice) || 0) * (Number(l.qty) || 1))}`).join("\n");
  const addressText = [addr.name, [addr.line1, addr.line2].filter(Boolean).join(", "), [addr.city, addr.state, addr.pincode].filter(Boolean).join(", "), addr.phone ? `Phone: ${addr.phone}` : ""].filter(Boolean).join("\n");

  const text = [
    "NEW ORDER RECEIVED",
    `Order: #${order.orderId}`,
    `Date: ${orderDate(order.createdAt)}`,
    `Payment: ${isCod ? "Cash on Delivery" : "Online Payment"}`,
    `Total: ${RUPEE(order.total)}${isCod ? ` (upfront ${RUPEE(order.codUpfront)}, at delivery ${RUPEE(order.codRemaining)})` : ""}`,
    "",
    "CUSTOMER:",
    `  Name: ${order.customerName || addr.name || "—"}`,
    `  Email: ${extra.customerEmail || "—"}`,
    `  Phone: ${addr.phone || extra.phone || "—"}`,
    `  WhatsApp opted in: ${extra.whatsappOptIn ? "Yes" : "No"}`,
    "",
    "ITEMS:",
    itemsText || "  —",
    "",
    "DELIVERY ADDRESS:",
    addressText || "  —",
    "",
    "View in admin: https://refurbishedkart.com/admin/orders",
  ].join("\n");

  const html = wrap(
    `<h3 style="margin:0 0 10px;color:#2e7d32">New Order #${order.orderId}</h3>
     <table style="font-size:14px;color:#333;border-collapse:collapse">
       <tr><td style="padding:2px 10px 2px 0"><b>Date</b></td><td>${orderDate(order.createdAt)}</td></tr>
       <tr><td style="padding:2px 10px 2px 0"><b>Payment</b></td><td>${isCod ? "Cash on Delivery" : "Online Payment"}</td></tr>
       <tr><td style="padding:2px 10px 2px 0"><b>Total</b></td><td>${RUPEE(order.total)}${isCod ? ` (upfront ${RUPEE(order.codUpfront)}, at delivery ${RUPEE(order.codRemaining)})` : ""}</td></tr>
     </table>
     <p style="font-size:14px;color:#333;margin:12px 0 4px"><b>Customer</b></p>
     <div style="font-size:14px;color:#333;line-height:1.6">
       ${order.customerName || addr.name || "—"}<br>
       ${extra.customerEmail || "—"} · ${addr.phone || extra.phone || "—"}<br>
       WhatsApp opted in: <b>${extra.whatsappOptIn ? "Yes" : "No"}</b>
     </div>
     <p style="font-size:14px;color:#333;margin:12px 0 4px"><b>Items</b></p>
     <div style="font-size:13px;color:#333;line-height:1.6">${lines.map((l) => `${l.name} | ${variantLabel(l)} | x${l.qty || 1} | ${RUPEE((Number(l.unitPrice) || 0) * (Number(l.qty) || 1))}`).join("<br>") || "—"}</div>
     <p style="font-size:14px;color:#333;margin:12px 0 4px"><b>Delivery address</b></p>
     <div style="font-size:13px;color:#333;line-height:1.6">${addressText.replace(/\n/g, "<br>") || "—"}</div>
     <p style="font-size:14px;margin-top:14px"><a href="https://refurbishedkart.com/admin/orders" style="color:#2e7d32;font-weight:700">View in admin → Orders</a></p>`
  );

  return mailer().sendMail({ from, to, subject: `New Order #${order.orderId} - ${RUPEE(order.total)} | ${paymentLabel}`, text, html });
}

/* Internal alert to the support team when a customer files a return. Not customer-
   facing. No-throw: wrap calls in try/catch so a mail failure never blocks the request. */
export async function sendReturnAdminAlert(data = {}) {
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const { returnId, orderNumber, customerName, customerEmail, productName, reason, description, whatsappNumber } = data;
  const subject = `New Return Request - Order #${orderNumber || returnId}`;
  const adminUrl = `https://refurbishedkart.com/admin/returns`;
  const text = [
    "A new return request has been submitted.",
    "",
    `Customer: ${customerName || "—"}`,
    `Email: ${customerEmail || "—"}`,
    `Order: #${orderNumber || "—"}`,
    `Product: ${productName || "—"}`,
    `Reason: ${reason || "—"}`,
    `Description: ${description || "—"}`,
    `WhatsApp: ${whatsappNumber || "—"}`,
    "",
    `Video sent on WhatsApp: +91 ${whatsappNumber || "—"}`,
    "",
    `View in admin: ${adminUrl} (Return ${returnId})`,
  ].join("\n");
  const html = wrap(
    `<p style="font-size:14px;color:#333">A new return request has been submitted.</p>
     <table style="font-size:14px;color:#333;border-collapse:collapse">
       <tr><td style="padding:2px 10px 2px 0"><b>Customer</b></td><td>${customerName || "—"}</td></tr>
       <tr><td style="padding:2px 10px 2px 0"><b>Email</b></td><td>${customerEmail || "—"}</td></tr>
       <tr><td style="padding:2px 10px 2px 0"><b>Order</b></td><td>#${orderNumber || "—"}</td></tr>
       <tr><td style="padding:2px 10px 2px 0"><b>Product</b></td><td>${productName || "—"}</td></tr>
       <tr><td style="padding:2px 10px 2px 0"><b>Reason</b></td><td>${reason || "—"}</td></tr>
       <tr><td style="padding:2px 10px 2px 0;vertical-align:top"><b>Description</b></td><td>${description || "—"}</td></tr>
       <tr><td style="padding:2px 10px 2px 0"><b>WhatsApp</b></td><td>+91 ${whatsappNumber || "—"}</td></tr>
     </table>
     <p style="font-size:13px;color:#666">Video sent on WhatsApp to +91 ${whatsappNumber || "—"}.</p>
     <p style="font-size:14px"><a href="${adminUrl}" style="color:#1B5E20;font-weight:700">View in admin → Returns</a> (Return ${returnId})</p>`
  );
  return mailer().sendMail({ from, to: SUPPORT_EMAIL, subject, text, html });
}

/* DOCUMENTED RECORD: when a customer submits refund details, the FULL details are
   emailed once to support@ — this email (timestamp + sender + content) IS the proof
   used to make the transfer. The DB only keeps masked values. `data.details` here
   carries the full raw fields. Internal-only; no-throw (wrap calls in try/catch). */
export async function sendBankDetailsAdminAlert(data = {}) {
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const { returnId, orderNumber, customerName, customerEmail, details = {} } = data;
  const subject = `Refund bank details (ACTION) - Return #${returnId || orderNumber}`;
  const adminUrl = `https://refurbishedkart.com/admin/returns`;
  const methodLabel = details.method === "upi" ? "UPI" : "Bank transfer";
  const rows =
    details.method === "upi"
      ? `<tr><td style="padding:2px 10px 2px 0"><b>UPI ID</b></td><td>${details.upiId || "—"}</td></tr>`
      : `<tr><td style="padding:2px 10px 2px 0"><b>Account holder</b></td><td>${details.accountHolderName || "—"}</td></tr>
         <tr><td style="padding:2px 10px 2px 0"><b>Account no.</b></td><td>${details.accountNumber || "—"}</td></tr>
         <tr><td style="padding:2px 10px 2px 0"><b>IFSC</b></td><td>${details.ifscCode || "—"}</td></tr>`;
  const text = [
    "A customer submitted refund bank details. THIS EMAIL IS THE RECORD — keep it for the transfer (the website only stores masked values).",
    "",
    `Return: ${returnId || "—"}`,
    `Order: #${orderNumber || "—"}`,
    `Customer: ${customerName || "—"}${customerEmail ? ` <${customerEmail}>` : ""}`,
    `Method: ${methodLabel}`,
    details.method === "upi"
      ? `UPI ID: ${details.upiId || "—"}`
      : `Account holder: ${details.accountHolderName || "—"}\nAccount number: ${details.accountNumber || "—"}\nIFSC: ${details.ifscCode || "—"}`,
    "",
    `Admin Returns: ${adminUrl} (Return ${returnId})`,
  ].join("\n");
  const html = wrap(
    `<p style="font-size:14px;color:#333">A customer submitted their refund details for <b>Return ${returnId || ""}</b> (Order #${orderNumber || "—"}).</p>
     <p style="font-size:13px;color:#b45309;font-weight:700">Keep this email — it is the record. The website stores only masked values, so the full details below are not retrievable elsewhere.</p>
     <table style="font-size:14px;color:#333;border-collapse:collapse">
       <tr><td style="padding:2px 10px 2px 0"><b>Customer</b></td><td>${customerName || "—"}${customerEmail ? ` &lt;${customerEmail}&gt;` : ""}</td></tr>
       <tr><td style="padding:2px 10px 2px 0"><b>Method</b></td><td>${methodLabel}</td></tr>
       ${rows}
     </table>
     <p style="font-size:14px"><a href="${adminUrl}" style="color:#1B5E20;font-weight:700">View in admin → Returns</a> (Return ${returnId})</p>`
  );
  return mailer().sendMail({ from, to: SUPPORT_EMAIL, subject, text, html });
}

/* Customer-facing: admin asked them to resubmit corrected refund details. `note` is
   the admin's reason. No-throw: wrap calls in try/catch. */
export async function sendBankResubmissionRequest(to, data = {}) {
  if (!to) return null;
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const { returnId, orderNumber, customerName, note } = data;
  const orderRef = orderNumber || returnId;
  const subject = `Action needed: resubmit your refund bank details - Order #${orderRef}`;
  const body = `<p style="font-size:14px;color:#333">Hi ${customerName || "there"},</p>
    <p style="font-size:14px;color:#333">We need you to re-enter your refund bank/UPI details for Order <b>#${orderRef}</b> so we can process your refund.</p>
    ${note ? `<p style="font-size:14px;color:#333">Reason: <b>${note}</b></p>` : ""}
    <p style="font-size:14px;color:#333">Please sign in to your account, open this return, and submit the corrected details.</p>
    <p style="font-size:13px;color:#666">Questions? +91 8448296273 (Mon–Sat, 11AM–6PM) · support@refurbishedkart.com</p>`;
  return mailer().sendMail({ from, to, subject, text: body.replace(/<[^>]+>/g, " "), html: wrap(body) });
}

export async function verifyTransport() {
  return mailer().verify();
}
