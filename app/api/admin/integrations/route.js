import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/adminAuth";
import { dbConnect, dbState } from "@/lib/server/mongoose";
import { Order } from "@/lib/server/models";
import { getStoreSettings } from "@/lib/server/settings";

export const dynamic = "force-dynamic";

/* Read-only integration status. Reflects real env configuration + DB state — no
   secrets are returned, only configured/not + mode + last-used where known. */
export async function GET(req) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    await dbConnect();
    const connected = dbState() === 1; // 1 = connected
    const settings = await getStoreSettings();

    const lastPaid = await Order.findOne({ paymentId: { $exists: true, $ne: null } })
      .sort({ createdAt: -1 }).select("createdAt").lean();

    const rzpKey = process.env.RAZORPAY_KEY_ID || "";
    const rzpMode = rzpKey.startsWith("rzp_live_") ? "Live" : rzpKey.startsWith("rzp_test_") ? "Test" : null;

    const integrations = [
      { key: "mongodb", name: "MongoDB", status: connected ? "ok" : "down", detail: connected ? "Connected" : "Disconnected" },
      { key: "razorpay", name: "Razorpay", status: rzpKey ? "ok" : "down", detail: rzpKey ? `${rzpMode || "Unknown"} mode` : "Not configured", lastUsed: lastPaid?.createdAt || null, configureHref: null },
      { key: "google_oauth", name: "Google OAuth", status: process.env.GOOGLE_CLIENT_ID ? "ok" : "down", detail: process.env.GOOGLE_CLIENT_ID ? "Configured" : "Not configured" },
      { key: "smtp", name: "Email (SMTP)", status: process.env.EMAIL_USER && process.env.EMAIL_PASS ? "ok" : "down", detail: process.env.EMAIL_USER ? `${process.env.EMAIL_HOST || "smtp.gmail.com"}` : "Not configured" },
      { key: "ga", name: "Google Analytics", status: settings.gaId ? "ok" : "off", detail: settings.gaId ? settings.gaId : "Not set — add under SEO tab", configureHref: "seo" },
      { key: "msg91", name: "MSG91 (SMS)", status: "soon", detail: "Coming soon" },
      { key: "shiprocket", name: "Shiprocket", status: "soon", detail: "Coming soon" },
    ];
    return NextResponse.json({ integrations });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
