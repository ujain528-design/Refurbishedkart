import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Otp, User } from "@/lib/server/models";
import { signJwt } from "@/lib/server/jwt";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    await dbConnect();
    const { phone, code } = await req.json();
    const rec = await Otp.findOne({ phone });
    if (!rec || rec.expiresAt < new Date()) {
      return NextResponse.json({ error: "OTP expired — request a new one" }, { status: 400 });
    }
    if (String(code) !== rec.code) {
      rec.attempts += 1;
      await rec.save();
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    // upsert user (new phone = new account)
    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({ phone, name: "RefurbishedKart User", provider: "otp", role: "customer" });
    }
    await Otp.deleteOne({ _id: rec._id });

    const token = signJwt({ sub: String(user._id), name: user.name, phone: user.phone, role: user.role });
    return NextResponse.json({
      token,
      user: { id: String(user._id), name: user.name, phone: user.phone, role: user.role },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
