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
  const { returnId, productName, refundAmount, deductionAmount, deductionReason, reason, shipTo } = data;

  let subject = "";
  let body = "";
  if (kind === "requested") {
    subject = `Return request ${returnId} received`;
    body = `<p style="font-size:14px;color:#333">We've received your return request <b>${returnId}</b>${productName ? ` for <b>${productName}</b>` : ""}. We'll review it and respond within 2 business days.</p>`;
  } else if (kind === "approved") {
    const deduction = Number(deductionAmount) > 0 ? ` (after a ${INR(deductionAmount)} deduction${deductionReason ? ` for ${deductionReason}` : ""})` : "";
    subject = `Return ${returnId} approved`;
    body = `<p style="font-size:14px;color:#333">Your return <b>${returnId}</b> is approved. A refund of <b>${INR(refundAmount)}</b>${deduction} will be processed once we receive the item.</p>
      ${shipTo ? `<p style="font-size:14px;color:#333">Please ship the item to:<br><span style="color:#555">${shipTo}</span></p>` : ""}`;
  } else if (kind === "rejected") {
    subject = `Return ${returnId} could not be approved`;
    body = `<p style="font-size:14px;color:#333">Your return request <b>${returnId}</b> could not be approved.${reason ? `<br>Reason: <b>${reason}</b>` : ""}</p>
      <p style="font-size:13px;color:#666">If you have questions, reply to this email or reach us on WhatsApp.</p>`;
  } else if (kind === "refunded") {
    subject = `Refund processed for return ${returnId}`;
    body = `<p style="font-size:14px;color:#333">Your refund of <b>${INR(refundAmount)}</b> for return <b>${returnId}</b> has been processed. It may take a few business days to reflect in your account.</p>`;
  } else {
    return null;
  }

  return mailer().sendMail({ from, to, subject, text: body.replace(/<[^>]+>/g, " "), html: wrap(body) });
}

export async function verifyTransport() {
  return mailer().verify();
}
