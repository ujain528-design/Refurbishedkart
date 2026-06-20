import StaticPage, { H2, P, UL } from "@/components/StaticPage";

export const metadata = {
  title: "Return Policy",
  description: "RefurbishedKart's 7-day return policy, eligibility, unboxing-video requirement, refund timeline and process.",
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

function XList({ items }) {
  return (
    <ul className="mt-3 space-y-2.5">
      {items.map((it, i) => (
        <li key={i} className="flex items-start gap-2.5 text-[13px] lg:text-[15px] leading-relaxed text-neutral-600">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-50 text-[11px] font-bold text-red-600">✗</span>
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

function Step({ n, title, children }) {
  return (
    <div className="flex gap-4 rounded-card border border-black/5 bg-white p-4 shadow-card">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">{n}</span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-ink">{title}</p>
        <div className="mt-1 text-[14px] leading-relaxed text-neutral-600">{children}</div>
      </div>
    </div>
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

export default function ReturnPolicyPage() {
  return (
    <StaticPage title="Return Policy" subtitle="Easy returns, honest process.">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-neutral-400">Last updated: June 2025</p>

      {/* 2 — Return window */}
      <H2>Return window</H2>
      <P>We offer a 7-day return window from the date of delivery for the following reasons:</P>
      <UL items={[
        "Product received with physical damage.",
        "Manufacturing defect.",
        "Wrong item received.",
      ]} />
      <P>Change-of-mind returns are also accepted within 7 days (conditions apply — see below).</P>

      {/* 3 — Unboxing video (mandatory) */}
      <H2>Unboxing video — mandatory</H2>
      <AmberBox>
        <p className="font-bold">To raise a return claim for damage, defect, or a wrong item, an unboxing video is mandatory.</p>
        <ul className="mt-2 space-y-1.5">
          <li>• Record a continuous, unedited video from opening the outer packaging to powering on the device.</li>
          <li>• The video must be shared within 24 hours of delivery.</li>
          <li>• Claims without an unboxing video will not be accepted under any circumstances.</li>
          <li>• This protects both you and us.</li>
        </ul>
      </AmberBox>

      {/* 4 — Eligible */}
      <H2>What&apos;s eligible for return</H2>
      <CheckList items={[
        "Product received with physical damage (dents, cracks, broken parts).",
        "Manufacturing defect (hardware failure on arrival).",
        "Dead on Arrival (product does not power on) — report within 24 hours with an unboxing video.",
        "Wrong item received (different model or configuration than ordered).",
        "Change of mind (within 7 days, conditions apply).",
      ]} />

      {/* 5 — Not eligible */}
      <H2>What&apos;s not eligible for return</H2>
      <XList items={[
        "Products showing signs of use, additional wear, or tampering.",
        "Physical or liquid damage caused after delivery.",
        "Software issues, OS problems, or issues resolvable remotely.",
        "Products with missing accessories, original packaging, or invoice.",
        "Claims made after 7 days of delivery.",
        "Damage / defect claims without an unboxing video.",
        "B2B / bulk orders (unless separately agreed in writing).",
      ]} />

      {/* 6 — How to raise a return */}
      <H2>How to raise a return request</H2>
      <div className="mt-4 space-y-3">
        <Step n={1} title="Contact us within 7 days">
          WhatsApp or call <a href={WHATSAPP} className="font-semibold text-brand hover:underline">+91 8448296273</a>, Monday to Friday, 11:00 AM – 6:00 PM. Share your order number, the reason for return, and photos or a video of the issue.
        </Step>
        <Step n={2} title="Share unboxing video">
          For damage / defect / wrong-item claims, share your unboxing video within 24 hours of delivery. Without this, the claim cannot be processed.
        </Step>
        <Step n={3} title="Return pickup">
          Once your return request is approved, we arrange a courier pickup from your delivery address.
          <ul className="mt-2 space-y-1.5">
            <li><span className="font-semibold text-ink">Damage / defect / wrong item:</span> pickup arranged and paid by RefurbishedKart.</li>
            <li><span className="font-semibold text-ink">Change of mind:</span> pickup arranged by RefurbishedKart; courier charges (both ways) are borne by the customer and deducted from the refund along with a ₹999 restocking fee.</li>
          </ul>
        </Step>
        <Step n={4} title="Inspection">
          Our technical team inspects the returned device. Inspection criteria:
          <ul className="mt-2 space-y-1.5">
            <li>• Device is unused and in original condition.</li>
            <li>• All accessories are included (charger, box, invoice).</li>
            <li>• Condition matches the original shipment.</li>
            <li>• No additional damage or tampering.</li>
          </ul>
        </Step>
        <Step n={5} title="Refund">
          The refund is initiated within 48 hours of receiving the returned device (pending inspection approval) and credited to your original payment method. Please allow 5–7 business days for the amount to reflect in your account (depending on your bank / payment provider).
        </Step>
      </div>

      {/* 7 — Change of mind */}
      <H2>Change-of-mind returns</H2>
      <P>We understand you may change your mind. Here&apos;s how it works:</P>
      <div className="mt-3 rounded-card border border-black/5 bg-white p-5 shadow-card">
        <CheckList items={[
          "Return accepted within 7 days of delivery.",
          "Product must be completely unused.",
          "Original packaging and all accessories must be intact.",
          "Invoice must be included.",
        ]} />
        <p className="mt-4 text-sm font-bold text-ink">Deductions from refund:</p>
        <ul className="mt-2 space-y-1.5 text-[14px] leading-relaxed text-neutral-600">
          <li>• ₹999 restocking fee.</li>
          <li>• Both-side courier charges (pickup from you + return of the original order if applicable). Courier charges will be communicated before pickup is arranged.</li>
        </ul>
        <p className="mt-4 text-[13px] leading-relaxed text-neutral-500">
          <span className="font-semibold text-ink">Note:</span> Change-of-mind returns do not include an exchange option. Please place a fresh order for the new product.
        </p>
      </div>

      {/* 8 — Refund timeline */}
      <H2>Refund timeline</H2>
      <div className="mt-3 overflow-hidden rounded-card border border-black/5 bg-white shadow-card">
        <table className="w-full text-[13px] lg:text-[14px]">
          <thead>
            <tr className="border-b border-black/5 bg-neutral-50 text-left text-neutral-500">
              <th className="px-4 py-3 font-semibold">Return reason</th>
              <th className="px-4 py-3 font-semibold">Refund timeline</th>
            </tr>
          </thead>
          <tbody className="text-neutral-600">
            <tr className="border-b border-black/5">
              <td className="px-4 py-3 font-semibold text-ink">Defect / damage / wrong item</td>
              <td className="px-4 py-3">Within 48 hours of receiving the device</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-semibold text-ink">Change of mind</td>
              <td className="px-4 py-3">Within 48 hours of receiving the device (after deductions)</td>
            </tr>
          </tbody>
        </table>
      </div>
      <P>Refund is credited to your original payment method. Allow 5–7 business days to reflect after initiation.</P>
      <div className="mt-4 rounded-card border border-black/5 bg-neutral-50 p-4">
        <p className="text-[13px] lg:text-[14px] leading-relaxed text-neutral-600">
          <span className="font-bold text-ink">Note:</span> For orders returned due to failed delivery (wrong address, unavailability, or refusal to accept), both-side courier charges will be deducted from the refund amount. View our <a href="/shipping" className="font-semibold text-brand hover:underline">Shipping Policy</a> for full details.
        </p>
      </div>

      {/* 9 — Packaging */}
      <H2>Packaging instructions</H2>
      <AmberBox>
        <p>Please pack the device securely in its original packaging before handover to the courier. Any damage during transit due to improper packaging will be the responsibility of the customer.</p>
      </AmberBox>

      {/* 10 — Contact */}
      <div className="mt-10 rounded-card border border-brand/15 bg-brand-softer/40 p-6 text-center">
        <h2 className="text-lg lg:text-xl font-bold text-ink">Have a return query?</h2>
        <p className="mt-2 text-[13px] lg:text-[15px] text-neutral-600">We&apos;re here Monday–Friday, 11:00 AM – 6:00 PM.</p>
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
