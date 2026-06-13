import StaticPage, { H2, P, UL } from "@/components/StaticPage";

export const metadata = {
  title: "Privacy Policy",
  description: "How RefurbishedKart collects, uses and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <StaticPage title="Privacy Policy" subtitle="Last updated: June 2026">
      <P>RefurbishedKart (“we”, “us”), operated by MMT Global Recycling Pvt. Ltd., is committed to protecting your privacy. This policy explains what we collect, why, and your choices.</P>

      <H2>Information we collect</H2>
      <UL items={[
        "Account details: name, email, and phone number provided at sign-in.",
        "Order details: delivery addresses, items purchased, and GST number if supplied.",
        "Payment information is processed by our payment partner; we do not store card numbers.",
        "Usage data: pages viewed and searches, used to improve the store.",
      ]} />

      <H2>How we use your information</H2>
      <P>To process and deliver orders, generate GST invoices, provide support, prevent fraud, and — only with your consent — send offers. We never sell your personal data.</P>

      <H2>Data security</H2>
      <P>We use industry-standard encryption in transit and restrict access to personal data.</P>

      <H2>Your rights</H2>
      <P>You may access, correct, or request deletion of your data, and opt out of marketing at any time by contacting us at support@refurbishedkart.com.</P>

      <H2>Cookies</H2>
      <P>We use essential cookies to keep you signed in and remember your cart. You can control non-essential cookies through your browser settings.</P>
    </StaticPage>
  );
}
