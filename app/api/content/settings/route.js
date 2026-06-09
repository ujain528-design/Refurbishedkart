import { NextResponse } from "next/server";
import { getStoreSettings, deliveryRules } from "@/lib/server/settings";

export const dynamic = "force-dynamic";

/* Public, non-admin store settings the storefront needs (delivery rules, COD
   limit, WhatsApp, low-stock threshold). No auth — these are buyer-facing. */
export async function GET() {
  try {
    const s = await getStoreSettings();
    const { freeDeliveryAbove, deliveryFee } = deliveryRules(s);
    return NextResponse.json({
      freeDeliveryAbove,
      deliveryFee,
      codLimit: Number(s.codLimit ?? 29999),
      lowStockThreshold: Number(s.lowStockThreshold ?? 5),
      whatsappNumber: s.whatsappNumber,
      storeName: s.storeName,
    });
  } catch (e) {
    return NextResponse.json({ freeDeliveryAbove: 999, deliveryFee: 99, error: e.message }, { status: 500 });
  }
}
