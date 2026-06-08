import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { User } from "@/lib/server/models";
import { userFromRequest } from "@/lib/server/jwt";

export const dynamic = "force-dynamic";

async function getUser(req) {
  const a = userFromRequest(req);
  if (!a) return { error: NextResponse.json({ error: "Login required" }, { status: 401 }) };
  await dbConnect();
  const user = await User.findById(a.sub);
  if (!user) return { error: NextResponse.json({ error: "User not found" }, { status: 404 }) };
  return { user };
}

export async function GET(req) {
  const { user, error } = await getUser(req);
  if (error) return error;
  return NextResponse.json({ addresses: user.addresses || [] });
}

export async function POST(req) {
  const { user, error } = await getUser(req);
  if (error) return error;
  const body = await req.json();
  if (body.isDefault) user.addresses.forEach((a) => (a.isDefault = false));
  if (user.addresses.length === 0) body.isDefault = true; // first address is default
  user.addresses.push(body);
  await user.save();
  return NextResponse.json({ addresses: user.addresses }, { status: 201 });
}

export async function PUT(req) {
  const { user, error } = await getUser(req);
  if (error) return error;
  const { id, ...patch } = await req.json();
  const addr = user.addresses.id(id);
  if (!addr) return NextResponse.json({ error: "Address not found" }, { status: 404 });
  if (patch.isDefault) user.addresses.forEach((a) => (a.isDefault = false));
  Object.assign(addr, patch);
  await user.save();
  return NextResponse.json({ addresses: user.addresses });
}

export async function DELETE(req) {
  const { user, error } = await getUser(req);
  if (error) return error;
  const { id } = await req.json();
  const addr = user.addresses.id(id);
  if (!addr) return NextResponse.json({ error: "Address not found" }, { status: 404 });
  const wasDefault = addr.isDefault;
  user.addresses.pull(id);
  if (wasDefault && user.addresses.length) user.addresses[0].isDefault = true;
  await user.save();
  return NextResponse.json({ addresses: user.addresses });
}
