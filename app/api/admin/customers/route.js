import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { requireAdmin } from "@/lib/server/adminAuth";
import { buildCustomerRows } from "@/lib/server/customerStats";

export const dynamic = "force-dynamic";

// GET — aggregated customer list for the admin table (JSON).
export async function GET(req) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const customers = await buildCustomerRows();
    return NextResponse.json({
      customers,
      totalCustomers: customers.length,
      whatsappSubscribers: customers.filter((c) => c.whatsappOptIn).length,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
