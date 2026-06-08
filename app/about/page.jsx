import StaticPage, { H2, P, UL } from "@/components/StaticPage";

export const metadata = { title: "About — RefurbishedKart" };

export default function AboutPage() {
  return (
    <StaticPage title="About RefurbishedKart" subtitle="Premium tech, second life — certified refurbished electronics for India.">
      <H2>Who we are</H2>
      <P>RefurbishedKart.com is a B2C and B2B marketplace for certified refurbished laptops, desktops, monitors, servers and workstations, operated by MMT Global Recycling Pvt. Ltd. We source enterprise-grade devices from corporate IT fleets, restore them to like-new condition, and sell them with transparent pricing and a GST invoice on every order.</P>

      <H2>Our mission</H2>
      <P>To make quality computing affordable and sustainable. Every device we sell is one less unit in a landfill and one more reliable machine in the hands of a student, professional, or growing business — at a fraction of the price of new.</P>

      <H2>Why refurbished</H2>
      <UL items={[
        "Up to 70% off retail for the same machine, professionally restored.",
        "Every unit clears a 32-point hardware and cosmetic inspection.",
        "Storage is wiped to NIST 800-88 standard with a certificate in the box.",
        "Minimum 6-month warranty, extendable to 1 year, plus 7-day returns.",
        "Lower e-waste — refurbishing extends a device's life by years.",
      ]} />

      <H2>By the numbers</H2>
      <P>18,500+ devices given a second life, an average 60% saving versus buying new, and a 32-point certification on every single unit. Refurbished isn't a compromise — it's the smarter buy.</P>
    </StaticPage>
  );
}
