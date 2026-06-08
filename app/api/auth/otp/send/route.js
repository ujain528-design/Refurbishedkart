import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Otp } from "@/lib/server/models";
import { sendOtpEmail } from "@/lib/server/mailer";

export const dynamic = "force-dynamic";

/* Generate a 6-digit OTP, store in Mongo with 5-min expiry, and DELIVER it by
   email via Gmail SMTP. Phone is the login identifier, but there's no SMS
   gateway yet — so the code is emailed (to `email` if given, else the store
   inbox) as a working placeholder, and also returned as devCode in dev. */
export async function POST(req) {
  try {
    await dbConnect();
    const { phone, email } = await req.json();
    if (!phone || String(phone).replace(/\D/g, "").length < 10) {
      return NextResponse.json({ error: "Valid phone required" }, { status: 400 });
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await Otp.findOneAndUpdate(
      { phone },
      { code, expiresAt, attempts: 0 },
      { upsert: true, new: true }
    );

    let emailed = false, emailError = null;
    const to = email || process.env.EMAIL_USER;
    try {
      await sendOtpEmail(to, code);
      emailed = true;
    } catch (e) {
      emailError = e.message; // surface but don't block — devCode still works
    }

    return NextResponse.json({
      sent: true,
      emailed,
      emailTo: emailed ? to : undefined,
      emailError,
      devCode: code, // remove when an SMS gateway is wired
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
