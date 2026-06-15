/* Shiprocket fulfillment — STUB.

   This is a placeholder for the real Shiprocket integration. It is called when an
   order is confirmed (see the webhook + verify routes). For now it only logs and
   returns null so the payment lifecycle is fully wired end-to-end without a live
   Shiprocket account. When you're ready to go live, fill in the workflow below.

   Credentials (set in .env.local when integrating):
     SHIPROCKET_EMAIL
     SHIPROCKET_PASSWORD

   Full workflow to implement:
     1. Authenticate
        POST https://apiv2.shiprocket.in/v1/external/auth/login
          body: { email: SHIPROCKET_EMAIL, password: SHIPROCKET_PASSWORD }
          → returns a bearer { token } (cache it ~10 days; it expires).

     2. Create an ad-hoc order
        POST https://apiv2.shiprocket.in/v1/external/orders/create/adhoc
          headers: { Authorization: `Bearer ${token}` }
          body: map our Order → Shiprocket payload
            order_id, order_date, pickup_location,
            billing_customer_name / billing_address / billing_city / billing_pincode /
            billing_state / billing_country / billing_email / billing_phone,
            shipping_is_billing: true,
            order_items: lines.map(l => ({ name, sku, units: qty, selling_price: unitPrice })),
            payment_method: "Prepaid",
            sub_total, length, breadth, height, weight
          → returns { order_id (shiprocket), shipment_id }
        Store order.shiprocketOrderId = <shiprocket order_id>.

     3. Assign AWB (courier)
        POST https://apiv2.shiprocket.in/v1/external/courier/assign/awb
          body: { shipment_id }
          → returns awb_code; store on the order (e.g. trackingNumber/courier).

     4. Generate pickup
        POST https://apiv2.shiprocket.in/v1/external/courier/generate/pickup
          body: { shipment_id }

     5. Update order.shiprocketStatus as Shiprocket status webhooks arrive.
*/

export async function createShiprocketOrder(order) {
  // eslint-disable-next-line no-console
  console.log("Shiprocket stub called for order:", order._id);
  // TODO: implement the auth → create adhoc order → assign AWB → generate pickup workflow above.
  return null;
}
