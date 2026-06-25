import StaticPage, { H2, P, UL } from "@/components/StaticPage";

export const metadata = {
  title: "Terms & Conditions",
  description: "The terms and conditions governing use of RefurbishedKart and purchases made on the site, operated by MMT Global Recycling Pvt. Ltd.",
};

const WHATSAPP = "https://wa.me/918448296273";
const EMAIL = "info@refurbishedkart.com";

function InfoRow({ label, children }) {
  return (
    <p className="text-[13px] lg:text-[14px] leading-relaxed text-neutral-600">
      <span className="font-semibold text-ink">{label}:</span> {children}
    </p>
  );
}

/* Highlighted important section wrapper (used for §3 and §7). */
function Callout({ children }) {
  return (
    <div className="mt-3 rounded-card border border-brand/20 bg-brand-softer/40 p-5">{children}</div>
  );
}

export default function TermsPage() {
  return (
    <StaticPage title="Terms & Conditions" subtitle="Please read these terms carefully before using our services.">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-neutral-400">Last updated: June 2025</p>

      {/* Company details */}
      <div className="mt-4 space-y-1.5 rounded-card border border-black/5 bg-white p-5 shadow-card">
        <InfoRow label="Company">MMT Global Recycling Pvt. Ltd.</InfoRow>
        <InfoRow label="Operating as">RefurbishedKart</InfoRow>
        <InfoRow label="Website"><a href="https://www.refurbishedkart.com" className="font-semibold text-brand hover:underline">www.refurbishedkart.com</a></InfoRow>
        <InfoRow label="Email"><a href={`mailto:${EMAIL}`} className="font-semibold text-brand hover:underline">{EMAIL}</a></InfoRow>
      </div>

      {/* 2 — Acceptance */}
      <H2>2. Acceptance of terms</H2>
      <P>By accessing or using RefurbishedKart and placing an order, you agree to be bound by these Terms &amp; Conditions. If you do not agree, please do not use our website.</P>

      {/* 3 — About our products (HIGHLIGHTED) */}
      <H2>3. About our products</H2>
      <P>All products sold on RefurbishedKart are refurbished or pre-owned devices sourced, tested, and certified by our technical team.</P>
      <Callout>
        <p className="text-sm font-bold text-ink">Product condition</p>
        <P>Currently, all products listed on RefurbishedKart are graded &apos;Excellent&apos;. Excellent grade devices are fully functional and have been thoroughly tested. However, they may show minor signs of prior use including:</P>
        <UL items={[
          "Light scratches or scuff marks on the body or lid.",
          "Minor wear marks on the screen (visible only at certain angles).",
          "Slight keyboard or trackpad wear.",
        ]} />
        <P>These cosmetic imperfections do not affect the functionality of the device and are inherent to refurbished products. They do not constitute a defect or grounds for return unless specifically disclosed otherwise on the product page.</P>

        <p className="mt-5 text-sm font-bold text-ink">Battery</p>
        <P>
          Batteries in refurbished devices have been tested and provide functional backup. However, battery capacity may be lower than the original manufacturer specifications due to natural degradation from prior use. Battery performance is not comparable to a brand new device. Battery health is tested and confirmed to provide functional backup. Exact battery health percentage is not displayed on the product page. If you need specific battery health information for a product, please contact us before purchasing at{" "}
          <a href={WHATSAPP} className="font-semibold text-brand hover:underline">+91 8448296273</a>.
        </P>

        <p className="mt-5 text-sm font-bold text-ink">Product images</p>
        <P>Images shown on product pages are representative of the model and configuration. Actual device appearance may vary slightly due to manufacturing batches, cosmetic wear, or color variations. Images are not exact representations of the specific unit you will receive.</P>
      </Callout>

      {/* 4 — Eligibility */}
      <H2>4. Eligibility</H2>
      <UL items={[
        "You must be at least 18 years of age to create an account or place an order.",
        "Payments must be made by individuals aged 18 or above.",
        "By using this website you confirm that you meet these requirements.",
      ]} />

      {/* 5 — Pricing & availability */}
      <H2>5. Pricing &amp; availability</H2>
      <UL items={[
        "All prices are in Indian Rupees (₹) and inclusive of applicable taxes.",
        "Prices are subject to change without notice.",
        "In case of a pricing error on our website, we reserve the right to cancel the order and issue a full refund before dispatch.",
        "Product availability is subject to stock. In the rare case a product becomes unavailable after your order is placed, we will offer a full refund or a suitable replacement at your discretion.",
      ]} />

      {/* 6 — Orders & payments */}
      <H2>6. Orders &amp; payments</H2>
      <UL items={[
        "Orders are confirmed only after successful payment.",
        "We accept online payments via Razorpay (cards, UPI, netbanking, wallets) and Cash on Delivery (COD) for eligible orders.",
        "COD is available on orders up to ₹29,999. A 10% advance is collected at checkout for COD orders.",
        "For COD orders: if delivery fails due to wrong address, unavailability, or refusal — both-side courier charges will be deducted from the advance amount.",
        "GST invoices are provided for all orders.",
      ]} />

      {/* 7 — Data wiping (HIGHLIGHTED) */}
      <H2>7. Data wiping &amp; previous user data</H2>
      <Callout>
        <P>All storage devices (HDD/SSD) sold by RefurbishedKart are securely wiped before resale using industry-standard data sanitization procedures in compliance with NIST 800-88 guidelines.</P>
        <P>All previous user data is permanently and irrecoverably deleted before the device reaches you.</P>
        <P>RefurbishedKart is not responsible for any claims, disputes, or liabilities arising from data associated with previous users of the device.</P>
      </Callout>

      {/* 8 — User accounts */}
      <H2>8. User accounts</H2>
      <UL items={[
        "You are responsible for maintaining the confidentiality of your account credentials.",
        "Any orders placed from your account are your responsibility.",
        <span key="notify">Notify us immediately at <a href={`mailto:${EMAIL}`} className="font-semibold text-brand hover:underline">{EMAIL}</a> if you suspect unauthorized access.</span>,
        "We reserve the right to suspend or terminate accounts found to be misused, fraudulent, or in violation of these terms.",
      ]} />

      {/* 9 — Coupons */}
      <H2>9. Coupons &amp; discounts</H2>
      <UL items={[
        "Coupons and discount codes are subject to specific terms and expiry dates as mentioned at the time of issue.",
        "Only one coupon can be applied per order.",
        "Coupons cannot be combined with other offers unless explicitly stated.",
        "We reserve the right to withdraw or modify coupon terms at any time.",
        "Coupons have no cash value and cannot be exchanged for cash.",
      ]} />

      {/* 10 — IP */}
      <H2>10. Intellectual property</H2>
      <P>All content on RefurbishedKart including but not limited to text, images, logos, graphics, and software is the property of MMT Global Recycling Pvt. Ltd. and is protected by applicable intellectual property laws.</P>
      <P>You may not copy, reproduce, distribute, or use any content from this website without our prior written permission.</P>

      {/* 11 — Compatibility */}
      <H2>11. Product compatibility</H2>
      <P>
        RefurbishedKart is not responsible if a purchased product is incompatible with your specific software, peripherals, or use case. Please verify compatibility requirements before placing your order. Contact us at{" "}
        <a href={WHATSAPP} className="font-semibold text-brand hover:underline">+91 8448296273</a> if you need guidance.
      </P>

      {/* 12 — Reviews */}
      <H2>12. Reviews &amp; feedback</H2>
      <UL items={[
        "We welcome honest reviews from verified buyers.",
        "We reserve the right to remove reviews that are fake, abusive, defamatory, or in violation of our community guidelines.",
        "Reviews must be based on genuine purchase experience.",
      ]} />

      {/* 13 — WhatsApp */}
      <H2>13. WhatsApp communication</H2>
      <P>By placing an order on RefurbishedKart, you consent to receive order-related updates and communications via WhatsApp on the phone number provided at checkout. This includes order confirmations, shipping updates, and delivery notifications.</P>
      <P>For promotional communications, we will only contact you if you have explicitly opted in at checkout.</P>
      <P>
        You can opt out of promotional WhatsApp messages at any time by sending &quot;STOP&quot; to{" "}
        <a href={WHATSAPP} className="font-semibold text-brand hover:underline">+91 8448296273</a>.
      </P>

      {/* 14 — Bulk / B2B */}
      <H2>14. Bulk &amp; B2B orders</H2>
      <P>
        For bulk purchases or B2B orders, separate terms and pricing may apply as mutually agreed in writing before the order is confirmed. Please contact us at{" "}
        <a href={`mailto:${EMAIL}`} className="font-semibold text-brand hover:underline">{EMAIL}</a> for bulk enquiries.
      </P>

      {/* 15 — Liability */}
      <H2>15. Limitation of liability</H2>
      <P>To the maximum extent permitted by applicable law:</P>
      <UL items={[
        "RefurbishedKart's liability is limited to the value of the order in question.",
        "We are not liable for any indirect, incidental, or consequential damages.",
        "We are not liable for delays or failures caused by circumstances beyond our control.",
      ]} />

      {/* 16 — Force majeure */}
      <H2>16. Force majeure</H2>
      <P>RefurbishedKart shall not be liable for any delay or failure to perform its obligations due to circumstances beyond its reasonable control, including but not limited to:</P>
      <UL items={[
        "Natural disasters or acts of God.",
        "Pandemic or public health emergency.",
        "Government actions or restrictions.",
        "Courier partner disruptions.",
        "Power failures or internet outages.",
      ]} />
      <P>In such cases, we will inform you as soon as possible and work to resolve the situation.</P>

      {/* 17 — Governing law */}
      <H2>17. Governing law &amp; disputes</H2>
      <P>These Terms &amp; Conditions are governed by the laws of India.</P>
      <P>Any disputes arising from these terms or your use of RefurbishedKart shall be subject to the exclusive jurisdiction of the courts in Delhi, India.</P>
      <P>
        We encourage you to contact us first at{" "}
        <a href={`mailto:${EMAIL}`} className="font-semibold text-brand hover:underline">{EMAIL}</a> to resolve any disputes amicably before pursuing legal action.
      </P>

      {/* 18 — Changes */}
      <H2>18. Changes to terms</H2>
      <P>We reserve the right to update these Terms &amp; Conditions at any time. Changes will be posted on this page with an updated date. Continued use of our website after changes constitutes acceptance of the new terms.</P>

      {/* 19 — Contact */}
      <H2>19. Contact us</H2>
      <P>For any queries regarding these terms:</P>
      <div className="mt-3 space-y-1.5 rounded-card border border-black/5 bg-white p-5 shadow-card">
        <InfoRow label="Email"><a href={`mailto:${EMAIL}`} className="font-semibold text-brand hover:underline">{EMAIL}</a></InfoRow>
        <InfoRow label="WhatsApp"><a href={WHATSAPP} className="font-semibold text-brand hover:underline">+91 8448296273</a></InfoRow>
        <InfoRow label="Address">147, Patparganj Industrial Area, Near Anand Vihar, Delhi – 110092</InfoRow>
        <InfoRow label="Time">Monday to Saturday, 11:00 AM – 6:00 PM</InfoRow>
      </div>

      {/* Contact CTA */}
      <div className="mt-10 rounded-card border border-brand/15 bg-brand-softer/40 p-6 text-center">
        <h2 className="text-lg lg:text-xl font-bold text-ink">Questions about these terms?</h2>
        <p className="mt-2 text-[13px] lg:text-[15px] text-neutral-600">We&apos;re here Monday–Saturday, 11:00 AM – 6:00 PM.</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <a href={WHATSAPP} className="rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-dark">
            WhatsApp +91 8448296273
          </a>
          <a href={`mailto:${EMAIL}`} className="rounded-full border border-brand/30 px-6 py-2.5 text-sm font-bold text-brand transition-colors hover:bg-brand-soft">
            {EMAIL}
          </a>
        </div>
      </div>
    </StaticPage>
  );
}
