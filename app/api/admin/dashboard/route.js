import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Order, Product, BulkEnquiry } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [ordersToday, allOrdersToday, activeProducts, newEnquiries, lowStockDocs, recentDocs] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: startOfDay } }),
      Order.find({ createdAt: { $gte: startOfDay }, status: { $ne: "Cancelled" } }).lean(),
      Product.countDocuments({ stock: { $gt: 0 } }),
      BulkEnquiry.countDocuments({ status: "New" }),
      Product.find({ stock: { $gt: 0, $lte: 5 } }).select("name brand stock attrs").lean(),
      Order.find({}).sort({ createdAt: -1 }).limit(8).lean(),
    ]);

    const revenueToday = allOrdersToday.reduce((a, o) => a + (o.total || 0), 0);

    return NextResponse.json({
      stats: {
        ordersToday,
        revenueToday,
        activeProducts,
        pendingReviews: 0, // no Review model yet (handoff)
        newEnquiries,
        lowStockCount: lowStockDocs.length,
      },
      recentOrders: recentDocs.map((o) => ({
        id: o.orderId, customer: o.customerName || o.shippingAddress?.name || "—",
        total: o.total, status: o.status, date: o.createdAt,
      })),
      lowStock: lowStockDocs.map((p) => ({
        product: p.name, variant: p.attrs?.ram ? `${p.attrs.ram}GB${p.attrs.ssd ? ` / ${p.attrs.ssd}` : ""}` : "—", stock: p.stock,
      })),
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
