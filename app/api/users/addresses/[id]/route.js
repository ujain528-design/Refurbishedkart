import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { User } from "@/lib/server/models";
import { userFromRequest } from "@/lib/server/jwt";

export const dynamic = "force-dynamic";

async function loadUser(req) {
  const a = userFromRequest(req);
  if (!a) return { error: NextResponse.json({ error: "Login required" }, { status: 401 }) };
  await dbConnect();
  const user = await User.findById(a.sub);
  if (!user) return { error: NextResponse.json({ error: "User not found" }, { status: 404 }) };
  return { user };
}

export async function PUT(req, { params }) {
  const { user, error } = await loadUser(req);
  if (error) return error;
  const patch = await req.json();
  const addr = user.addresses.id(params.id);
  if (!addr) return NextResponse.json({ error: "Address not found" }, { status: 404 });
  if (patch.isDefault) user.addresses.forEach((a) => (a.isDefault = false));
  delete patch._id;
  Object.assign(addr, patch);
  await user.save();
  return NextResponse.json({ addresses: user.addresses });
}

export async function DELETE(req, { params }) {
  const { user, error } = await loadUser(req);
  if (error) return error;
  const addr = user.addresses.id(params.id);
  if (!addr) return NextResponse.json({ error: "Address not found" }, { status: 404 });
  const wasDefault = addr.isDefault;
  user.addresses.pull(params.id);
  if (wasDefault && user.addresses.length) user.addresses[0].isDefault = true;
  await user.save();
  return NextResponse.json({ addresses: user.addresses });
}
