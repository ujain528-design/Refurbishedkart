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

export async function verifyTransport() {
  return mailer().verify();
}
