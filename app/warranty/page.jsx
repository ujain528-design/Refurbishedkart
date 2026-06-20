import StaticPage, { H2, P, UL } from "@/components/StaticPage";

export const metadata = {
  title: "Warranty Policy",
  description: "Warranty coverage, claim process and service details for RefurbishedKart certified refurbished products.",
};

const WHATSAPP = "https://wa.me/918448296273";

/* Green-check "covered" list. */
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

/* Red-X "not covered" list. */
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

/* Numbered claim step card (matches the return-policy step style). */
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

export default function WarrantyPage() {
  return (
    <StaticPage title="Warranty Policy" subtitle="We stand behind every device we sell.">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-neutral-400">Last updated: June 2025</p>

      {/* 2 — Coverage period */}
      <H2>Warranty coverage period</H2>
      <UL items={[
        "The warranty period for each product is mentioned on the respective product page and order confirmation.",
        "Coverage ranges up to 1 year depending on the product.",
        "The warranty period starts from the date of delivery.",
        "Warranty is non-transferable — it is valid only for the original buyer.",
      ]} />

      {/* 3 — What's covered */}
      <H2>What&apos;s covered</H2>
      <CheckList items={[
        "Hardware component failures (RAM, SSD, motherboard, processor).",
        "Power-related failures (charging port, power button).",
        "Display failures NOT caused by physical impact or pressure.",
        "Keyboard / trackpad failures due to manufacturing defects.",
        "WiFi / Bluetooth hardware failures.",
      ]} />

      {/* 4 — What's not covered */}
      <H2>What&apos;s not covered</H2>
      <XList items={[
        "Physical damage (drops, cracks, dents).",
        "Liquid damage of any kind.",
        "Screen lines, cracks, or damage caused by physical impact or pressure.",
        "Battery degradation due to normal usage (battery is covered only if completely non-functional on arrival).",
        "Software issues, virus, malware, or OS corruption.",
        "Damage caused by improper use or unauthorized repairs.",
        "Consumable parts (keyboard keys, rubber feet, stickers).",
        "Cosmetic damage (scratches, dents that don't affect functionality).",
        "Accessories (charger, bag, mouse).",
      ]} />
      <div className="mt-4 rounded-card border border-black/5 bg-neutral-50 p-4">
        <p className="text-[13px] lg:text-[14px] leading-relaxed text-neutral-600">
          <span className="font-bold text-ink">Note on screen damage:</span> Screen lines or display damage appearing after physical impact, pressure, or mishandling are considered physical damage and are not covered under warranty.
        </p>
      </div>

      {/* 5 — How to claim */}
      <H2>How to claim warranty — step by step</H2>
      <div className="mt-4 space-y-3">
        <Step n={1} title="Contact us">
          Call or WhatsApp <a href={WHATSAPP} className="font-semibold text-brand hover:underline">+91 8448296273</a>, Monday to Friday, 11:00 AM – 6:00 PM. Share your order number, a description of the issue, and photos or a video of the problem.
        </Step>
        <Step n={2} title="Diagnosis">
          Our team will review your claim within 2 working days and confirm whether it is covered under warranty.
        </Step>
        <Step n={3} title="Device pickup / dispatch">
          <span className="font-semibold text-ink">Urban areas:</span> we arrange a pickup from your location at no cost.{" "}
          <span className="font-semibold text-ink">Rural areas / areas where pickup is not available:</span> you send the device to our facility — courier charges from you to us are borne by the customer. Return shipping after repair is arranged by RefurbishedKart at no cost.
        </Step>
        <Step n={4} title="Repair">
          The device is inspected and repaired at our facility. Turnaround time is 20–25 working days from the date of receipt, depending on location and availability of parts.
        </Step>
        <Step n={5} title="Return">
          The repaired device is dispatched back to your address via courier.
        </Step>
      </div>

      {/* 6 — Service facility */}
      <H2>Our service facility</H2>
      <div className="mt-3 rounded-card border border-black/5 bg-white p-5 shadow-card">
        <p className="text-sm font-bold text-ink">RefurbishedKart Service Center</p>
        <p className="mt-1 text-[14px] leading-relaxed text-neutral-600">
          147, 3rd Floor, Patparganj Industrial Area, Near Anand Vihar<br />
          Delhi – 110092
        </p>
        <p className="mt-3 text-[13px] text-neutral-500">
          <span className="font-semibold text-ink">Working hours:</span> Monday to Friday, 11:00 AM – 6:00 PM
        </p>
      </div>

      {/* 7 — Packaging callout */}
      <H2>Packaging your device</H2>
      <div className="mt-3 rounded-card border border-amber-200 bg-amber-50 p-4">
        <p className="flex items-start gap-2.5 text-[13px] lg:text-[14px] leading-relaxed text-amber-900">
          <span aria-hidden="true" className="mt-0.5 shrink-0 text-base">⚠</span>
          <span>Please ensure the device is packed in its original packaging or with adequate protective material before sending it to us. Any damage caused during transit due to improper packaging will be the responsibility of the customer and will not be covered under warranty.</span>
        </p>
      </div>

      {/* 8 — Void conditions */}
      <H2>Warranty void conditions</H2>
      <P>Your warranty will be immediately void if:</P>
      <XList items={[
        "Physical damage is found on inspection (cracks, dents, broken parts).",
        "Liquid damage is detected.",
        "The device has been tampered with or repaired by an unauthorized service center.",
        "The serial number or warranty seal has been removed or tampered with.",
      ]} />
      <P>In case of warranty void, our team will inform you within 2 working days of inspection. The device will be repaired only after your explicit consent and payment of repair charges, including both-side courier charges.</P>

      {/* 9 — If repair not possible */}
      <H2>If repair is not possible</H2>
      <P>In the rare case that your device cannot be repaired under warranty, we will:</P>
      <ol className="mt-3 space-y-2.5">
        {[
          "First offer a replacement with the same model.",
          "If the same model is unavailable, offer a replacement with similar specifications and equivalent value.",
          "If no suitable replacement is available, provide a full refund of the purchase amount.",
        ].map((it, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[13px] lg:text-[15px] leading-relaxed text-neutral-600">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] font-bold text-brand">{i + 1}</span>
            <span>{it}</span>
          </li>
        ))}
      </ol>

      {/* 10 — Data responsibility */}
      <H2>Data responsibility</H2>
      <P>Please back up all your data before sending the device for repair. RefurbishedKart is not responsible for any data loss during the repair process.</P>

      {/* 11 — Contact CTA */}
      <div className="mt-10 rounded-card border border-brand/15 bg-brand-softer/40 p-6 text-center">
        <h2 className="text-lg lg:text-xl font-bold text-ink">Have a warranty question?</h2>
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
