import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { User } from "@/lib/server/models";
import { userFromRequest } from "@/lib/server/jwt";

export const dynamic = "force-dynamic";

export async function PUT(req, { params }) {
  const a = userFromRequest(req);
  if (!a) return NextResponse.json({ error: "Login required" }, { status: 401 });
  await dbConnect();
  const user = await User.findById(a.sub);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const addr = user.addresses.id(params.id);
  if (!addr) return NextResponse.json({ error: "Address not found" }, { status: 404 });
  user.addresses.forEach((x) => (x.isDefault = String(x._id) === String(params.id)));
  await user.save();
  return NextResponse.json({ addresses: user.addresses });
}
