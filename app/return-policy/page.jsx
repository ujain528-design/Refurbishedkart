import StaticPage, { H2, P, UL } from "@/components/StaticPage";

export const metadata = { title: "Return & Refund Policy — RefurbishedKart" };

export default function ReturnPolicyPage() {
  return (
    <StaticPage title="Return & Refund Policy" subtitle="7-day no-questions-asked returns on every order.">
      <H2>The promise</H2>
      <P>If a device doesn't match its listing, or you simply change your mind, you have 7 days from delivery to request a replacement or a full refund. If the fault is ours, return shipping is on us.</P>

      <H2>How to return — step by step</H2>
      <div className="mt-4 space-y-3">
        {[
          ["Raise a request", "Go to My Account → My Orders, open the order, and select Return. Or message us on WhatsApp."],
          ["Pickup scheduled", "Our logistics partner schedules a pickup from your address, usually within 2 working days."],
          ["Inspection", "On receipt, the unit is checked against its original certified condition."],
          ["Refund issued", "Once cleared, your refund is processed to the original payment method within 5 working days."],
        ].map(([t, d], i) => (
          <div key={i} className="flex gap-4 rounded-card border border-black/5 bg-white p-4 shadow-card">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">{i + 1}</span>
            <div>
              <p className="text-sm font-bold text-ink">{t}</p>
              <p className="mt-0.5 text-[14px] text-neutral-600">{d}</p>
            </div>
          </div>
        ))}
      </div>

      <H2>What's eligible</H2>
      <UL items={[
        "Device returned in the same condition as delivered, with all accessories and the certification card.",
        "Returns raised within 7 days of delivery.",
        "COD advance payments are refunded along with any amount paid.",
      ]} />

      <H2>What's not eligible</H2>
      <UL items={[
        "Physical damage caused after delivery.",
        "Missing accessories, certification card, or original packaging.",
        "Requests raised after the 7-day window.",
      ]} />
    </StaticPage>
  );
}
