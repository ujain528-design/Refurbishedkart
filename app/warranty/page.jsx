import StaticPage, { H2, P, UL } from "@/components/StaticPage";

export const metadata = {
  title: "Warranty Policy",
  description: "Warranty coverage and claim process for RefurbishedKart certified refurbished products.",
};

export default function WarrantyPage() {
  return (
    <StaticPage title="Warranty Policy" subtitle="Every device is covered. No fine print on the parts that matter.">
      <H2>What's covered</H2>
      <UL items={[
        "All hardware faults — motherboard, RAM, storage, display, battery, ports, and power.",
        "Manufacturing and refurbishment defects.",
        "On laptops, battery health is guaranteed at a minimum of 80% at the time of sale.",
      ]} />

      <H2>Duration</H2>
      <P>Every product ships with a minimum 6-month warranty, extendable to 1 year at checkout. The exact period for your device is shown on its product page and printed on your invoice.</P>

      <H2>What's not covered</H2>
      <UL items={[
        "Physical or liquid damage caused after delivery.",
        "Software issues unrelated to hardware, or third-party software you install.",
        "Consumable wear beyond the guaranteed battery threshold.",
        "Unauthorised repairs or tampering with the device.",
      ]} />

      <H2>How to claim — step by step</H2>
      <div className="mt-4 space-y-3">
        {[
          ["Raise a claim", "From My Account → My Orders, or via WhatsApp support, describe the issue."],
          ["Remote diagnosis", "Our team runs a quick check to confirm it's a covered hardware fault."],
          ["Repair or replace", "We arrange a pickup-repair-return at no cost to you."],
          ["Back in action", "Most claims are resolved within 5–7 working days."],
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
    </StaticPage>
  );
}
