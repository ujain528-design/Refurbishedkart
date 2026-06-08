import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { User } from "@/lib/server/models";
import { userFromRequest } from "@/lib/server/jwt";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const a = userFromRequest(req);
  if (!a) return NextResponse.json({ error: "Login required" }, { status: 401 });
  try {
    await dbConnect();
    const u = await User.findById(a.sub).lean();
    return NextResponse.json({ ids: u?.wishlist || [] });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  const a = userFromRequest(req);
  if (!a) return NextResponse.json({ error: "Login required" }, { status: 401 });
  try {
    await dbConnect();
    const { productId } = await req.json();
    const u = await User.findByIdAndUpdate(
      a.sub,
      { $addToSet: { wishlist: Number(productId) } },
      { new: true }
    ).lean();
    return NextResponse.json({ ids: u?.wishlist || [] });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
