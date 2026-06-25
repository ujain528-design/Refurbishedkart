import StaticPage, { H2, P, UL } from "@/components/StaticPage";

export const metadata = {
  title: "Shipping Policy",
  description: "RefurbishedKart shipping charges, delivery timelines, order tracking, Cash on Delivery rules and transit-damage process.",
};

const WHATSAPP = "https://wa.me/918448296273";

function CheckList({ items }) {
  return (
    <ul className="mt-3 space-y-2.5">
      {items.map((it, i) => (
        <li key={i} className="flex items-start gap-2.5 text-[13px] lg:text-[15px] leading-relaxed text-neutral-600">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] font-bold text-brand">✓</span>
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

function AmberBox({ children }) {
  return (
    <div className="mt-3 rounded-card border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-2.5 text-[13px] lg:text-[14px] leading-relaxed text-amber-900">
        <span aria-hidden="true" className="mt-0.5 shrink-0 text-base">⚠</span>
        <div>{children}</div>
      </div>
    </div>
  );
}

/* Simple two-column reference table used for charges + timelines. */
function RefTable({ head, rows }) {
  return (
    <div className="mt-3 overflow-hidden rounded-card border border-black/5 bg-white shadow-card">
      <table className="w-full text-[13px] lg:text-[14px]">
        <thead>
          <tr className="border-b border-black/5 bg-neutral-50 text-left text-neutral-500">
            {head.map((h, i) => (
              <th key={i} className={`px-4 py-3 font-semibold ${i === head.length - 1 ? "text-right" : ""}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="text-neutral-600">
          {rows.map((r, i) => (
            <tr key={i} className={i < rows.length - 1 ? "border-b border-black/5" : ""}>
              {r.map((c, j) => (
                <td key={j} className={`px-4 py-3 ${j === 0 ? "font-semibold text-ink" : ""} ${j === r.length - 1 ? "text-right" : ""}`}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ShippingPolicyPage() {
  return (
    <StaticPage title="Shipping Policy" subtitle="Fast, reliable delivery across India.">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-neutral-400">Last updated: June 2025</p>

      {/* 2 — Shipping charges */}
      <H2>Shipping charges</H2>
      <RefTable
        head={["Order value", "Shipping charge"]}
        rows={[
          ["₹7,999 and above", <span key="free" className="font-bold text-brand">FREE</span>],
          ["Below ₹7,999", "₹199"],
        ]}
      />
      <P>All prices are inclusive of GST.</P>

      {/* 3 — Delivery timeline */}
      <H2>Delivery timeline</H2>
      <P>Estimated delivery time after your order is dispatched:</P>
      <RefTable
        head={["Location", "Estimated delivery"]}
        rows={[
          ["Metro cities (Delhi, Mumbai, Bangalore, Chennai, Kolkata, Hyderabad)", "3–5 business days"],
          ["Tier 2 & Tier 3 cities", "5–7 business days"],
          ["Remote & rural areas", "7–10 business days"],
        ]}
      />
      <P>Note: Delivery timelines are estimates and may vary due to courier partner operations, weather, or public holidays.</P>

      {/* 4 — Order processing */}
      <H2>Order processing time</H2>
      <P>Orders are processed within 1–2 business days after payment confirmation. You will receive a confirmation email and WhatsApp message once your order is dispatched.</P>

      {/* 5 — Tracking */}
      <H2>Shipment tracking</H2>
      <P>Once your order is dispatched:</P>
      <UL items={[
        "Tracking details will be shared via email and WhatsApp.",
        "You can track your order using the tracking link provided by our courier partner.",
        <span key="wa">For tracking queries, WhatsApp us at <a href={WHATSAPP} className="font-semibold text-brand hover:underline">+91 8448296273</a>.</span>,
      ]} />

      {/* 6 — Cash on Delivery (highlighted) */}
      <H2>Cash on Delivery (COD)</H2>
      <div className="mt-3 rounded-card border border-brand/20 bg-brand-softer/50 p-5">
        <p className="text-sm font-bold text-brand">COD is available on select orders</p>
        <CheckList items={[
          "Available on orders up to ₹29,999.",
          "10% of the order value is collected upfront at the time of checkout.",
          "The remaining amount is paid to the delivery executive at the time of delivery.",
        ]} />
        <p className="mt-4 text-sm font-bold text-ink">Important COD conditions:</p>
        <ul className="mt-2 space-y-1.5 text-[13px] lg:text-[14px] leading-relaxed text-neutral-600">
          <li>• COD is <span className="font-semibold text-ink">not available</span> on orders above ₹29,999.</li>
          <li>• The 10% upfront amount is non-refundable in case of non-delivery due to customer unavailability or a wrong address.</li>
          <li>• If the order is undeliverable (failed delivery attempts), both-side courier charges will be deducted from the 10% upfront amount.</li>
          <li>• Any remaining amount after courier deduction will be refunded to your original payment method.</li>
        </ul>
      </div>

      {/* 7 — Transit damage */}
      <H2>Transit damage</H2>
      <P>All orders are carefully packed before dispatch. In the unlikely event that your order arrives damaged due to transit:</P>
      <UL items={[
        "Report immediately within 24 hours of delivery with an unboxing video.",
        "RefurbishedKart will arrange a replacement or refund at no cost to you.",
        "Transit damage is different from product defects — please refer to our Return Policy and Warranty Policy for those cases.",
      ]} />
      <AmberBox>
        An unboxing video recorded continuously from opening the package is required for any transit-damage claim. Claims without it cannot be accepted.
      </AmberBox>

      {/* 8 — Failed delivery */}
      <H2>Failed delivery / re-shipping</H2>
      <P>Our courier partners will attempt delivery 3 times. If delivery fails:</P>
      <UL items={[
        "The order will be held at the nearest hub for 3 days.",
        "After that, the order will be returned to us.",
      ]} />
      <P>Re-shipping charges will be borne by the customer if delivery failed due to:</P>
      <UL items={[
        "Wrong address provided.",
        "Customer unavailability.",
        "Refusal to accept delivery.",
      ]} />

      {/* 8b — Refunds for failed delivery (online payment orders) */}
      <H2>Refunds for failed delivery (online payment orders)</H2>
      <P>If your online payment order is undeliverable and returned to us due to:</P>
      <UL items={[
        "Wrong address provided.",
        "Customer unavailability after 3 delivery attempts.",
        "Refusal to accept delivery.",
      ]} />
      <P>The following will apply:</P>
      <UL items={[
        "Both-side courier charges will be deducted from your refund amount.",
        "The remaining amount will be refunded to your original payment method within 48 hours of the order returning to our facility.",
        "Please allow 5–7 business days for the refund to reflect in your account.",
      ]} />
      <div className="mt-4 rounded-card border border-brand/15 bg-brand-softer/40 p-4">
        <p className="text-sm font-bold text-ink">To avoid this, please ensure:</p>
        <CheckList items={[
          "Your delivery address is correct and complete.",
          "Your phone number is reachable during delivery hours (9 AM – 7 PM).",
          "Someone is available to receive the package.",
        ]} />
      </div>

      {/* 9 — Areas we ship to */}
      <H2>Areas we ship to</H2>
      <P>We ship across India. Some remote pin codes may have extended delivery timelines. For pin code availability, contact us before placing your order.</P>

      {/* 10 — Contact */}
      <div className="mt-10 rounded-card border border-brand/15 bg-brand-softer/40 p-6 text-center">
        <h2 className="text-lg lg:text-xl font-bold text-ink">Have a shipping query?</h2>
        <p className="mt-2 text-[13px] lg:text-[15px] text-neutral-600">We&apos;re here Monday–Saturday, 11:00 AM – 6:00 PM.</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <a href={WHATSAPP} className="rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-dark">
            WhatsApp +91 8448296273
          </a>
          <a href="mailto:support@refurbishedkart.com" className="rounded-full border border-brand/30 px-6 py-2.5 text-sm font-bold text-brand transition-colors hover:bg-brand-soft">
            support@refurbishedkart.com
          </a>
        </div>
      </div>
    </StaticPage>
  );
}
