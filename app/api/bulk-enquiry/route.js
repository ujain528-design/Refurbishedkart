import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { BulkEnquiry } from "@/lib/server/models";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const required = ["name", "org", "email", "phone", "quantity"];
    const missing = required.filter((k) => !body[k]);
    if (missing.length) return NextResponse.json({ error: `Missing: ${missing.join(", ")}` }, { status: 400 });

    const doc = await BulkEnquiry.create({
      name: body.name, company: body.org, email: body.email, phone: body.phone,
      category: body.category, quantity: Number(body.quantity), message: body.message, status: "New",
    });
    return NextResponse.json({ ok: true, id: String(doc._id) }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
