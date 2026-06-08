import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { User } from "@/lib/server/models";
import { userFromRequest } from "@/lib/server/jwt";

export const dynamic = "force-dynamic";

export async function DELETE(req, { params }) {
  const a = userFromRequest(req);
  if (!a) return NextResponse.json({ error: "Login required" }, { status: 401 });
  try {
    await dbConnect();
    const u = await User.findByIdAndUpdate(
      a.sub,
      { $pull: { wishlist: Number(params.productId) } },
      { new: true }
    ).lean();
    return NextResponse.json({ ids: u?.wishlist || [] });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
