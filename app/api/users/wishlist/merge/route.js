import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { User } from "@/lib/server/models";
import { userFromRequest } from "@/lib/server/jwt";

export const dynamic = "force-dynamic";

/* Merge a guest's localStorage wishlist into the server wishlist, de-duped. */
export async function POST(req) {
  const a = userFromRequest(req);
  if (!a) return NextResponse.json({ error: "Login required" }, { status: 401 });
  try {
    await dbConnect();
    const { ids = [] } = await req.json();
    const nums = ids.map(Number).filter((n) => !Number.isNaN(n));
    const u = await User.findByIdAndUpdate(
      a.sub,
      { $addToSet: { wishlist: { $each: nums } } },
      { new: true }
    ).lean();
    return NextResponse.json({ ids: u?.wishlist || [] });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
