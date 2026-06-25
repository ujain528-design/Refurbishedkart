// payment-pending/page.jsx is a client component and can't export metadata, so
// this server layout supplies the noindex directive for the route.
export const metadata = {
  title: "Complete Your Payment — RefurbishedKart",
  robots: { index: false, follow: false },
};

export default function PaymentPendingLayout({ children }) {
  return children;
}
