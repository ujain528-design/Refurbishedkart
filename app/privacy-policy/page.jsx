import StaticPage, { H2, P, UL } from "@/components/StaticPage";

export const metadata = {
  title: "Privacy Policy",
  description: "How MMT Global Recycling Pvt. Ltd. (RefurbishedKart) collects, uses, shares and protects your personal information.",
};

const WHATSAPP = "https://wa.me/918448296273";
const EMAIL = "info@refurbishedkart.com";

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

/* Small labelled detail block (company / addresses). */
function InfoRow({ label, children }) {
  return (
    <p className="text-[13px] lg:text-[14px] leading-relaxed text-neutral-600">
      <span className="font-semibold text-ink">{label}:</span> {children}
    </p>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <StaticPage title="Privacy Policy" subtitle="Your privacy matters to us.">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-neutral-400">Last updated: June 2025</p>

      {/* Company details */}
      <div className="mt-4 space-y-1.5 rounded-card border border-black/5 bg-white p-5 shadow-card">
        <InfoRow label="Company">MMT Global Recycling Pvt. Ltd.</InfoRow>
        <InfoRow label="Operating as">RefurbishedKart</InfoRow>
        <InfoRow label="Registered Address">Ground Floor, E-13, Laxmi Nagar, West Delhi – 110092</InfoRow>
        <InfoRow label="Working Address">147, 3rd Floor, Patparganj Industrial Area, Near Anand Vihar, Delhi – 110092</InfoRow>
        <InfoRow label="Email"><a href={`mailto:${EMAIL}`} className="font-semibold text-brand hover:underline">{EMAIL}</a></InfoRow>
      </div>

      {/* 2 — Introduction */}
      <H2>1. Introduction</H2>
      <P>
        This Privacy Policy describes how MMT Global Recycling Pvt. Ltd. (&quot;we&quot;, &quot;us&quot;, or &quot;RefurbishedKart&quot;)
        collects, uses, and protects your personal information when you visit or make a purchase from{" "}
        <a href="https://www.refurbishedkart.com" className="font-semibold text-brand hover:underline">www.refurbishedkart.com</a>.
        By using our website, you agree to the collection and use of information in accordance with this policy.
      </P>

      {/* 3 — Information we collect */}
      <H2>2. Information we collect</H2>
      <P>We collect the following information:</P>
      <p className="mt-3 text-sm font-bold text-ink">a) Information you provide directly</p>
      <UL items={[
        "Full name",
        "Email address",
        "Phone number",
        "Delivery address",
        "GST number (optional, for business invoices)",
        "WhatsApp opt-in preference",
      ]} />
      <p className="mt-4 text-sm font-bold text-ink">b) Payment information</p>
      <P>Payments are processed securely by Razorpay. We do not store your card details, UPI IDs, or banking information on our servers.</P>
      <p className="mt-4 text-sm font-bold text-ink">c) Automatically collected information</p>
      <UL items={[
        "IP address",
        "Browser type and version",
        "Device type and operating system",
        "Pages visited and time spent",
        "Referring website",
        "Cookies and similar tracking technologies",
      ]} />

      {/* 4 — How we use */}
      <H2>3. How we use your information</H2>
      <P>We use your information to:</P>
      <CheckList items={[
        "Process and fulfill your orders.",
        "Send order confirmations, shipping updates, and invoices.",
        "Send warranty and return related communications.",
        "Provide customer support.",
        "Send promotional offers and updates via email and WhatsApp (only if you have opted in).",
        "Improve our website and services using analytics data.",
        "Comply with legal obligations.",
        "Prevent fraud and ensure security.",
      ]} />

      {/* 5 — Sharing */}
      <H2>4. Sharing your information</H2>
      <P>We share your information only with:</P>
      <p className="mt-3 text-sm font-bold text-ink">a) Courier Partners</p>
      <P>Your name, phone number, and delivery address are shared with our courier partners (Delhivery, BlueDart, DTDC, and similar) solely for the purpose of delivering your order.</P>
      <p className="mt-4 text-sm font-bold text-ink">b) Payment Processor</p>
      <P>Your payment information is processed by Razorpay. Please refer to Razorpay&apos;s Privacy Policy for details on how they handle your data.</P>
      <p className="mt-4 text-sm font-bold text-ink">c) Google Analytics</p>
      <P>We use Google Analytics to understand how visitors use our website. Google Analytics collects anonymized data about your visit. You can opt out of Google Analytics by installing the Google Analytics Opt-out Browser Add-on.</P>
      <AmberBox>
        We do <span className="font-bold">not</span> sell, rent, or trade your personal information to any third party for marketing purposes.
      </AmberBox>

      {/* 6 — Cookies */}
      <H2>5. Cookies</H2>
      <P>We use cookies to:</P>
      <UL items={[
        "Keep you logged in.",
        "Remember your cart items.",
        "Analyze website traffic via Google Analytics.",
        "Improve your browsing experience.",
      ]} />
      <P>You can disable cookies in your browser settings. Note that disabling cookies may affect the functionality of our website (e.g. cart and login may not work properly).</P>

      {/* 7 — Marketing */}
      <H2>6. Marketing communications</H2>
      <P>If you have opted in to receive marketing communications, we may contact you via email and WhatsApp. You can opt out at any time by:</P>
      <UL items={[
        "Clicking “Unsubscribe” in any marketing email.",
        <span key="wa">Sending &quot;STOP&quot; on WhatsApp to <a href={WHATSAPP} className="font-semibold text-brand hover:underline">+91 8448296273</a>.</span>,
        <span key="em">Emailing us at <a href={`mailto:${EMAIL}`} className="font-semibold text-brand hover:underline">{EMAIL}</a>.</span>,
      ]} />
      <AmberBox>
        Order-related communications (confirmations, shipping updates, invoices) will always be sent regardless of your marketing preferences.
      </AmberBox>

      {/* 8 — Retention */}
      <H2>7. Data retention</H2>
      <P>We retain your personal information for:</P>
      <UL items={[
        "Active accounts: as long as your account is active.",
        "Order data: 7 years (required for GST and accounting compliance).",
        "Marketing data: until you opt out.",
      ]} />

      {/* 9 — Security */}
      <H2>8. Data security</H2>
      <P>We implement appropriate technical and organizational measures to protect your personal information, including:</P>
      <CheckList items={[
        "SSL encryption on all pages.",
        "Secure payment processing via Razorpay.",
        "Limited access to personal data within our team.",
        "Regular security reviews.",
      ]} />
      <P>However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.</P>

      {/* 10 — Rights */}
      <H2>9. Your rights</H2>
      <P>You have the right to:</P>
      <CheckList items={[
        "Access the personal data we hold about you.",
        "Request correction of inaccurate data.",
        "Request deletion of your data (subject to legal retention requirements).",
        "Opt out of marketing communications.",
        "Withdraw consent at any time.",
      ]} />
      <P>
        To exercise any of these rights, contact us at{" "}
        <a href={`mailto:${EMAIL}`} className="font-semibold text-brand hover:underline">{EMAIL}</a>.
      </P>

      {/* 11 — Children */}
      <H2>10. Children&apos;s privacy</H2>
      <P>Our website is not intended for children under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.</P>

      {/* 12 — Changes */}
      <H2>11. Changes to this policy</H2>
      <P>We may update this Privacy Policy from time to time. We will notify you of significant changes by:</P>
      <UL items={[
        "Posting the updated policy on this page.",
        "Updating the “Last updated” date.",
        "Sending an email notification for major changes.",
      ]} />
      <P>We encourage you to review this policy periodically.</P>

      {/* 13 — Grievance Officer */}
      <H2>12. Grievance Officer</H2>
      <P>In accordance with the Information Technology Act, 2000 and rules made thereunder, the name and contact details of the Grievance Officer are:</P>
      <div className="mt-3 space-y-1.5 rounded-card border border-black/5 bg-white p-5 shadow-card">
        <InfoRow label="Name">Utkarsh Jain</InfoRow>
        <InfoRow label="Company">MMT Global Recycling Pvt. Ltd.</InfoRow>
        <InfoRow label="Address">147, 3rd Floor, Patparganj Industrial Area, Near Anand Vihar, Delhi – 110092</InfoRow>
        <InfoRow label="Email"><a href={`mailto:${EMAIL}`} className="font-semibold text-brand hover:underline">{EMAIL}</a></InfoRow>
        <InfoRow label="Phone"><a href={WHATSAPP} className="font-semibold text-brand hover:underline">+91 8448296273</a></InfoRow>
        <InfoRow label="Time">Monday to Friday, 11:00 AM – 6:00 PM</InfoRow>
      </div>
      <P>The Grievance Officer will acknowledge your complaint within 24 hours and resolve it within 15 days.</P>

      {/* 14 — Contact */}
      <div className="mt-10 rounded-card border border-brand/15 bg-brand-softer/40 p-6 text-center">
        <h2 className="text-lg lg:text-xl font-bold text-ink">Contact us</h2>
        <p className="mt-2 text-[13px] lg:text-[15px] text-neutral-600">For any privacy-related queries — Monday to Friday, 11:00 AM – 6:00 PM.</p>
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
