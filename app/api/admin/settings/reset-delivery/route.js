import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/server/mongoose";
import { Settings } from "@/lib/server/models";
import { requireAdmin } from "@/lib/server/adminAuth";
import { SETTINGS_DEFAULTS as DEFAULTS } from "@/lib/server/settings";

export const dynamic = "force-dynamic";

/* One-time fix: the saved Settings doc may still hold the OLD shipping values
   (freeDeliveryAbove 999 / deliveryFee 99) from before the policy changed. Those
   persisted values override the code defaults via getStoreSettings's
   { ...DEFAULTS, ...data } merge, so the storefront keeps showing ₹99. This route
   force-writes the correct values (7,999 / 199) and removes the stale aliases
   (deliveryCharge / freeDeliveryThreshold) that deliveryRules() would otherwise
   prefer. Visit it once while signed in as admin (dev bypasses auth). */
async function reset() {
  await dbConnect();
  const doc = await Settings.findById("store");
  const data = { ...DEFAULTS, ...(doc?.data || {}) };

  const before = {
    freeDeliveryAbove: data.freeDeliveryAbove,
    deliveryFee: data.deliveryFee,
    deliveryCharge: data.deliveryCharge,
    freeDeliveryThreshold: data.freeDeliveryThreshold,
  };

  data.freeDeliveryAbove = 7999;
  data.deliveryFee = 199;
  // Stale aliases win over deliveryFee in deliveryRules() — drop them entirely.
  delete data.deliveryCharge;
  delete data.freeDeliveryThreshold;

  await Settings.findByIdAndUpdate("store", { $set: { data } }, { upsert: true });

  return {
    ok: true,
    before,
    after: { freeDeliveryAbove: data.freeDeliveryAbove, deliveryFee: data.deliveryFee },
    message: "Shipping settings reset to ₹7,999 free threshold / ₹199 flat fee.",
  };
}

export async function GET(req) {
  const { error } = requireAdmin(req);
  if (error) return error;
  try {
    return NextResponse.json(await reset());
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export const POST = GET;
