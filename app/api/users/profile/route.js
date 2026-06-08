import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { User } from "@/lib/server/models";
import { userFromRequest } from "@/lib/server/jwt";

export const dynamic = "force-dynamic";

function publicUser(u) {
  return {
    id: String(u._id), name: u.name, email: u.email, phone: u.phone,
    image: u.image, role: u.role, addresses: u.addresses || [], wishlist: u.wishlist || [],
  };
}

export async function GET(req) {
  const a = userFromRequest(req);
  if (!a) return NextResponse.json({ error: "Login required" }, { status: 401 });
  try {
    await dbConnect();
    const u = await User.findById(a.sub).lean();
    if (!u) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ user: publicUser(u) });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req) {
  const a = userFromRequest(req);
  if (!a) return NextResponse.json({ error: "Login required" }, { status: 401 });
  try {
    await dbConnect();
    const { name, email, phone } = await req.json();
    const set = {};
    if (name != null) set.name = name;
    if (email != null) set.email = email;
    if (phone != null) set.phone = phone;
    const u = await User.findByIdAndUpdate(a.sub, { $set: set }, { new: true }).lean();
    if (!u) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ user: publicUser(u) });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
