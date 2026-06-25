import { NextResponse } from "next/server";
import { mailer } from "@/lib/server/mailer";

export const dynamic = "force-dynamic";

const TO = process.env.CONTACT_TO || "support@refurbishedkart.com";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUBJECTS = ["General Enquiry", "Order Related", "Warranty Claim", "Return Request", "Bulk Order", "Other"];
const esc = (s) => String(s || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* Contact form → email to support. Validates server-side; replyTo is the
   customer's email so support can reply directly. */
export async function POST(req) {
  try {
    const { name, email, phone, subject, message } = await req.json();
    const cleanPhone = String(phone || "").replace(/\D/g, "");

    if (!String(name || "").trim()) return NextResponse.json({ error: "Name is required." }, { status: 400 });
    if (!EMAIL_RE.test(String(email || "").trim())) return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    if (cleanPhone.length < 10) return NextResponse.json({ error: "A valid 10-digit phone number is required." }, { status: 400 });
    if (!SUBJECTS.includes(subject)) return NextResponse.json({ error: "Please choose a subject." }, { status: 400 });
    if (!String(message || "").trim()) return NextResponse.json({ error: "Message is required." }, { status: 400 });

    const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;
    const rows = [
      ["Name", name],
      ["Email", email],
      ["Phone", cleanPhone],
      ["Subject", subject],
      ["Message", message],
    ]
      .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;font-weight:600;color:#333;vertical-align:top">${k}</td><td style="padding:4px 0;color:#444;white-space:pre-wrap">${esc(v)}</td></tr>`)
      .join("");

    await mailer().sendMail({
      from,
      to: TO,
      replyTo: email,
      subject: `New Contact Form: ${subject} from ${name}`,
      text: `New contact form submission\n\nName: ${name}\nEmail: ${email}\nPhone: ${cleanPhone}\nSubject: ${subject}\n\nMessage:\n${message}`,
      html: `<div style="font-family:system-ui,sans-serif;max-width:560px">
        <h2 style="color:#1B5E20;margin:0 0 12px">New contact form submission</h2>
        <table style="border-collapse:collapse;font-size:14px">${rows}</table>
      </div>`,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: `Couldn't send your message: ${e.message}` }, { status: 500 });
  }
}
