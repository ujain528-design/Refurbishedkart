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

export async function verifyTransport() {
  return mailer().verify();
}
