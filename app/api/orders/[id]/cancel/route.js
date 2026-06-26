import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Self-serve cancel disabled — cancellations handled by support team only.
// Orders can be cancelled only before dispatch by contacting support
// (+91 8448296273, Mon–Sat 11AM–6PM). This endpoint is intentionally inert so
// no client can self-cancel an order; it returns 403 for any request.
export async function POST() {
  return NextResponse.json(
    { error: "Self-serve cancellation is disabled. Please contact support to cancel an order before dispatch." },
    { status: 403 }
  );
}
