import StaticPage, { H2, P, UL } from "@/components/StaticPage";

export const metadata = { title: "Terms of Service — RefurbishedKart" };

export default function TermsPage() {
  return (
    <StaticPage title="Terms of Service" subtitle="Last updated: June 2026">
      <P>By using RefurbishedKart.com you agree to these terms. Please read them carefully.</P>

      <H2>Use of the platform</H2>
      <P>You must provide accurate information when creating an account and placing orders. You are responsible for activity under your account. We may suspend accounts engaged in fraud or abuse.</P>

      <H2>Products and pricing</H2>
      <UL items={[
        "All products are certified refurbished and graded; condition is disclosed on each listing.",
        "All prices are in INR and inclusive of GST unless stated otherwise.",
        "We strive for accuracy but may correct pricing or specification errors before dispatch.",
        "Stock is limited; an item in your cart is not reserved until the order is confirmed.",
      ]} />

      <H2>Orders and payment</H2>
      <P>An order is confirmed once payment (or the COD advance) is received. We reserve the right to cancel and refund an order if a product becomes unavailable or a pricing error is found.</P>

      <H2>Warranty and returns</H2>
      <P>Products carry the warranty stated on their listing and a 7-day return window. See our Return Policy and Warranty Policy pages for details.</P>

      <H2>Limitation of liability</H2>
      <P>Our liability for any claim is limited to the amount paid for the relevant product. We are not liable for indirect or consequential losses.</P>

      <H2>Governing law</H2>
      <P>These terms are governed by the laws of India, with jurisdiction in the courts of Bengaluru, Karnataka.</P>
    </StaticPage>
  );
}
