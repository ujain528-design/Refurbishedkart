"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/CartContext";
import { useAuth } from "@/lib/AuthContext";
import { createOrder, getAddresses, addAddress, getPublicSettings, createRazorpayOrder, verifyPayment } from "@/lib/api";

/* Ensure the Razorpay checkout script is available (layout also lazy-loads it). */
function loadRazorpay() {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}
import { formatINR, INDIAN_STATES, SELLER_STATE, computeLineTaxes } from "@/lib/data";
import { BrokenDeviceIcon, LockIcon, ShieldIcon, ReturnIcon, ClipboardIcon, ChevronDown } from "@/components/Icons";

const FREE_DELIVERY_ABOVE = 999;
const DELIVERY_FEE = 99;
const COD_LIMIT = 29999; // COD available up to this order total
const COD_ADVANCE = 500; // advance paid now to confirm a COD order

const inputCls =
  "w-full rounded-lg border border-black/10 px-3.5 py-2.5 text-sm text-ink placeholder:text-neutral-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15";

const SAVED_ADDRESS = {
  id: "home",
  name: "Utkarsh Jain",
  line: "402, Brigade Gateway, Rajajinagar",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560055",
  phone: "+91 98765 43210",
};

function Field({ label, optional, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-semibold text-neutral-600">
        {label} {optional && <span className="font-normal text-neutral-400">(optional)</span>}
      </span>
      {children}
    </label>
  );
}

// Two choices only. "Pay Online" opens the Razorpay modal where the customer
// picks UPI / Card / Net Banking / Wallet — the real instrument is read back from
// Razorpay after payment. COD is separate because it changes the order flow (₹500 advance).
const PAYMENT_METHODS = [
  { id: "online", label: "Pay Online — UPI, Card, Net Banking, Wallets" },
  { id: "cod", label: "Cash on Delivery" },
];

export default function CheckoutView() {
  const { ready, items, subtotal, discount, coupon, orderItems, clearCart, clearCoupon } = useCart();
  const { isLoggedIn, user } = useAuth();
  const router = useRouter();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddrId, setSelectedAddrId] = useState(null);
  const [useNew, setUseNew] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", pincode: "", line1: "", line2: "", city: "", state: SELLER_STATE });
  const [saveAddr, setSaveAddr] = useState(false);
  const [pay, setPay] = useState("online"); // "online" | "cod"
  const [gstin, setGstin] = useState("");
  const [summaryOpen, setSummaryOpen] = useState(false); // mobile
  const [gstOpen, setGstOpen] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [pendingOrder, setPendingOrder] = useState(null); // created order awaiting payment (for retry)
  const [rules, setRules] = useState({ freeDeliveryAbove: FREE_DELIVERY_ABOVE, deliveryFee: DELIVERY_FEE, gstRate: 18 });

  useEffect(() => {
    getPublicSettings().then((s) => setRules({ freeDeliveryAbove: s.freeDeliveryAbove ?? FREE_DELIVERY_ABOVE, deliveryFee: s.deliveryFee ?? DELIVERY_FEE, gstRate: Number(s.gstRate ?? 18) })).catch(() => {});
  }, []);

  // Fetch the logged-in user's saved addresses (Step 8).
  useEffect(() => {
    if (!isLoggedIn) { setUseNew(true); return; }
    getAddresses()
      .then((list) => {
        setAddresses(list);
        const def = list.find((a) => a.isDefault) || list[0];
        if (def) setSelectedAddrId(def._id);
        else setUseNew(true);
      })
      .catch(() => setUseNew(true));
  }, [isLoggedIn]);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const selectedAddr = addresses.find((a) => a._id === selectedAddrId) || null;
  const shipState = useNew ? form.state : selectedAddr?.state || SELLER_STATE;

  if (!ready) return <div className="py-24 text-center text-sm text-neutral-400">Loading…</div>;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 lg:py-24 text-center">
        <h1 className="text-xl lg:text-2xl font-extrabold tracking-tight text-ink">Your cart is empty</h1>
        <p className="mt-2 text-sm text-neutral-500">Add an item before checking out.</p>
        <Link href="/products/laptops" className="mt-7 inline-block rounded-full bg-brand px-7 py-2.5 lg:py-3 text-sm font-bold text-white hover:bg-brand-dark">
          Continue Shopping
        </Link>
      </div>
    );
  }

  const delivery = subtotal > rules.freeDeliveryAbove ? 0 : rules.deliveryFee;
  const interState = shipState !== SELLER_STATE;
  // GST is a flat store-wide rate (default 18%), identical basis to the invoice
  // (computeLineTaxes). Inter-state → IGST; intra-state → CGST + SGST (half each).
  const storeGst = Number(rules.gstRate) || 18;
  const taxLines = items
    .filter((it) => !it.outOfStock)
    .map((it) => ({ unitPrice: it.unitPrice, qty: it.qty, gstRate: storeGst }));
  const { gst } = computeLineTaxes(taxLines, discount, interState, storeGst);
  const uniformRate = storeGst;
  const halfRate = +(storeGst / 2).toFixed(2);
  const grandTotal = subtotal - discount + delivery;
  const codAllowed = grandTotal <= COD_LIMIT;
  const isCod = pay === "cod" && codAllowed;
  const codRemaining = grandTotal - COD_ADVANCE;
  const baseLabel = isCod ? `Pay ${formatINR(COD_ADVANCE)} & Confirm Order` : `Pay ${formatINR(grandTotal)} & Place Order`;
  const payLabel = pendingOrder ? "Retry Payment" : baseLabel;
  const methods = PAYMENT_METHODS; // COD always visible (disabled above the limit)

  /* Open Razorpay for an order. Non-COD pays the full total; COD pays the ₹500
     advance. On verified success: clear cart + go to confirmation. On
     failure/dismiss: keep the order (pending_payment), preserve cart, allow retry. */
  const startPayment = async (order) => {
    setPlacing(true);
    setOrderError("");
    try {
      const payAmount = isCod ? COD_ADVANCE : grandTotal;
      const created = await createRazorpayOrder(order.id, payAmount);
      const ok = await loadRazorpay();
      if (!ok || !window.Razorpay) throw new Error("Couldn't load the payment gateway.");

      const rzp = new window.Razorpay({
        key: created.keyId,
        amount: created.amount,
        currency: "INR",
        order_id: created.razorpayOrderId,
        name: "RefurbishedKart",
        description: `Order #${order.id}`,
        prefill: { name: user?.name || "", email: user?.email || "", contact: user?.phone || "" },
        theme: { color: "#1B5E20" },
        handler: async (resp) => {
          try {
            const v = await verifyPayment({
              razorpayOrderId: resp.razorpay_order_id,
              razorpayPaymentId: resp.razorpay_payment_id,
              razorpaySignature: resp.razorpay_signature,
              orderId: order.id,
            });
            if (v.success) { clearCart(); router.push(`/order-confirmation?orderId=${order.id}`); }
            else { setOrderError(v.error || "Payment verification failed."); setPlacing(false); }
          } catch (e) { setOrderError(e.message || "Verification failed."); setPlacing(false); }
        },
        modal: { ondismiss: () => { setOrderError("Payment incomplete. Your order is saved — retry payment or choose a different method."); setPlacing(false); } },
      });
      rzp.on("payment.failed", (r) => { setOrderError(r?.error?.description || "Payment failed. Your order is saved — retry."); setPlacing(false); });
      rzp.open();
    } catch (e) {
      setOrderError(e.message || "Couldn't start payment.");
      setPlacing(false);
    }
  };

  const placeOrder = async () => {
    if (placing) return;
    if (pendingOrder) { startPayment(pendingOrder); return; } // retry same order
    setPlacing(true);
    setOrderError("");
    try {
      let shippingAddress;
      if (useNew) {
        if (!form.name || !form.phone || !form.line1 || !form.pincode) {
          throw new Error("Please fill name, phone, address and pincode.");
        }
        shippingAddress = { ...form };
        if (saveAddr && isLoggedIn) { try { await addAddress(form); } catch {} }
      } else {
        shippingAddress = selectedAddr || null;
      }
      // Server recomputes every price — client totals are never trusted (PRD §5.3).
      const order = await createOrder({
        items: orderItems(),
        shippingAddress,
        // "ONLINE" is a placeholder; the verify route overwrites it with the real
        // instrument (card/upi/netbanking/wallet) read from Razorpay. COD stays "COD".
        paymentMethod: pay === "cod" ? "COD" : "ONLINE",
        couponCode: coupon?.code || null,
        buyerGstin: gstin || null,
      });
      setPendingOrder(order);
      startPayment(order); // opens Razorpay
    } catch (e) {
      setOrderError(e.message || "Couldn't place order. Please try again.");
      setPlacing(false); // stay on page, preserve form + cart
    }
  };

  const Radio = ({ id, label, disabled, children }) => (
    <div
      className={`rounded-card border transition-colors ${
        disabled
          ? "border-black/10 bg-neutral-50 opacity-60"
          : pay === id
          ? "border-brand bg-brand-softer/40"
          : "border-black/10"
      }`}
    >
      <label className={`flex items-center gap-3 px-4 py-2.5 lg:py-3.5 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}>
        <input
          type="radio"
          name="pay"
          checked={pay === id}
          disabled={disabled}
          onChange={() => !disabled && setPay(id)}
          className="h-4 w-4 accent-brand"
        />
        <span className="text-sm font-semibold text-ink">{label}</span>
      </label>
      {/* enabled+selected shows the input panel; disabled always shows its note */}
      {((!disabled && pay === id) || disabled) && children && (
        <div className="border-t border-black/5 px-4 py-4">{children}</div>
      )}
    </div>
  );

  const Summary = () => (
    <div className="space-y-4">
      {/* items */}
      <div className="space-y-3">
        {items.map((it) => (
          <div key={it.key} className="flex gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-100">
              {it.image ? <img src={it.image} alt="" className="h-full w-full object-contain p-1" /> : <BrokenDeviceIcon style={{ width: 22, height: 22 }} className="text-neutral-300" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-ink">{it.name}</p>
              <p className="text-[12px] text-neutral-500">
                {it.ram || ""}{it.ram && it.ssd ? " · " : ""}{it.ssd ? `${it.ssd}` : ""} · Qty {it.qty}
              </p>
            </div>
            <p className="text-[13px] font-bold text-ink">{formatINR(it.unitPrice * it.qty)}</p>
          </div>
        ))}
      </div>

      <dl className="space-y-2.5 border-t border-black/5 pt-4 text-sm">
        {/* 1. Subtotal */}
        <div className="flex justify-between"><dt className="text-neutral-500">Subtotal</dt><dd className="font-semibold text-ink">{formatINR(subtotal)}</dd></div>

        {/* 2. Delivery */}
        <div className="flex justify-between"><dt className="text-neutral-500">Delivery</dt><dd className="font-semibold text-ink">{delivery === 0 ? <span className="text-brand">Free</span> : formatINR(delivery)}</dd></div>

        {/* 3. Coupon discount — with remove (carried over from cart) */}
        {coupon && (
          <div className="flex items-center justify-between">
            <dt className="flex items-center gap-1.5 text-brand">
              {coupon.code} applied{coupon.type === "flat" ? "" : ` (${coupon.value}%)`}
              <button onClick={clearCoupon} aria-label="Remove coupon" className="flex h-5 w-5 items-center justify-center rounded-full text-brand transition-colors hover:bg-brand/15">✕</button>
            </dt>
            <dd className="font-semibold text-brand">− {formatINR(discount)}</dd>
          </div>
        )}

        {/* 4. Amount after discount */}
        <div className="flex justify-between border-t border-black/5 pt-2.5"><dt className="text-neutral-500">Amount after discount</dt><dd className="font-semibold text-ink">{formatINR(subtotal - discount)}</dd></div>

        {/* 5. GST breakup — collapsible (default open), extracted from amount after discount */}
        <div>
          <button onClick={() => setGstOpen((v) => !v)} className="flex w-full items-center justify-between text-neutral-500">
            <span>GST (included above)</span>
            <ChevronDown style={{ width: 14, height: 14 }} className={`transition-transform ${gstOpen ? "rotate-180" : ""}`} />
          </button>
          {gstOpen && (
            <div className="mt-1.5 space-y-1 pl-3 text-[13px] text-neutral-400">
              {interState ? (
                <div className="flex justify-between"><span>IGST{uniformRate != null ? ` ${uniformRate}%` : ""}</span><span>{formatINR(gst.igst)}</span></div>
              ) : (
                <>
                  <div className="flex justify-between"><span>CGST{halfRate != null ? ` ${halfRate}%` : ""}</span><span>{formatINR(gst.cgst)}</span></div>
                  <div className="flex justify-between"><span>SGST{halfRate != null ? ` ${halfRate}%` : ""}</span><span>{formatINR(gst.sgst)}</span></div>
                </>
              )}
            </div>
          )}
        </div>
      </dl>

      {/* 6. Grand Total */}
      <div className="flex items-baseline justify-between border-t border-black/5 pt-4">
        <span className="text-base font-bold text-ink">Grand Total</span>
        <span className="text-xl lg:text-2xl font-extrabold tracking-tight text-brand">{formatINR(grandTotal)}</span>
      </div>

      {/* COD advance split — after Grand Total, only when COD selected */}
      {isCod && (
        <div className="space-y-2 rounded-lg bg-brand-softer px-4 py-3 text-sm">
          <div className="flex justify-between"><span className="text-neutral-600">Pay Now (advance)</span><span className="font-semibold text-brand">{formatINR(COD_ADVANCE)}</span></div>
          <div className="flex justify-between"><span className="text-neutral-600">Pay at Delivery</span><span className="font-semibold text-ink">{formatINR(codRemaining)}</span></div>
        </div>
      )}

      {/* GSTIN */}
      <div className="pt-1">
        <Field label="Have a GSTIN? Enter for B2B invoice" optional>
          <input value={gstin} onChange={(e) => setGstin(e.target.value.toUpperCase())} placeholder="22AAAAA0000A1Z5" className={inputCls} />
        </Field>
      </div>

      {orderError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-[13px] font-semibold text-red-600">{orderError}</p>
      )}
      <button
        onClick={placeOrder}
        disabled={placing}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-brand py-2.5 lg:py-3.5 text-sm font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
      >
        <LockIcon style={{ width: 16, height: 16 }} />
        {placing ? "Placing order…" : payLabel}
      </button>

      {/* trust signals */}
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 pt-1 text-[11px] font-medium text-neutral-500">
        <span className="flex items-center gap-1.5"><LockIcon style={{ width: 14, height: 14 }} className="text-brand" />256-bit SSL Encrypted</span>
        <span className="flex items-center gap-1.5"><ReturnIcon style={{ width: 14, height: 14 }} className="text-brand" />7 Day Returns</span>
        <span className="flex items-center gap-1.5"><ClipboardIcon style={{ width: 14, height: 14 }} className="text-brand" />GST Invoice</span>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* breadcrumb */}
      <nav className="text-[13px] text-neutral-400" aria-label="Checkout steps">
        <Link href="/cart" className="hover:text-brand">Cart</Link>
        <span className="mx-2">›</span>
        <span className="font-semibold text-ink">Delivery</span>
        <span className="mx-2">›</span>
        <span className="font-semibold text-ink">Payment</span>
      </nav>

      {/* mobile collapsible summary at top */}
      <div className="mt-5 lg:hidden">
        <button onClick={() => setSummaryOpen((v) => !v)} className="flex w-full items-center justify-between rounded-card border border-black/5 bg-white px-4 py-3 shadow-card">
          <span className="text-sm font-bold text-ink">Order Summary · {formatINR(grandTotal)}</span>
          <ChevronDown style={{ width: 16, height: 16 }} className={`transition-transform ${summaryOpen ? "rotate-180" : ""}`} />
        </button>
        {summaryOpen && <div className="mt-3 rounded-card border border-black/5 bg-white p-3.5 lg:p-5 shadow-card"><Summary /></div>}
      </div>

      <div className="mt-6 gap-4 lg:gap-8 lg:grid lg:grid-cols-[1fr_minmax(340px,40%)]">
        {/* ── left: address + payment ── */}
        <div className="space-y-5 lg:space-y-8 pb-28 lg:pb-0">
          {/* address */}
          <section>
            <h2 className="text-base lg:text-lg font-bold text-ink">Delivery Address</h2>
            <div className="mt-4 space-y-3">
              {!useNew && addresses.length > 0 && (
                <div className="space-y-3">
                  {addresses.map((a) => (
                    <label
                      key={a._id}
                      className={`flex cursor-pointer items-start gap-3 rounded-card border-2 p-4 ${selectedAddrId === a._id ? "border-brand bg-brand-softer/40" : "border-black/10"}`}
                    >
                      <input type="radio" name="addr" checked={selectedAddrId === a._id} onChange={() => setSelectedAddrId(a._id)} className="mt-1 h-4 w-4 accent-brand" />
                      <div className="text-sm">
                        <p className="font-bold text-ink">{a.name}{a.phone ? ` · ${a.phone}` : ""}{a.isDefault ? " · Default" : ""}</p>
                        <p className="mt-0.5 text-neutral-500">
                          {[a.line1, a.line2, a.city, a.state].filter(Boolean).join(", ")}{a.pincode ? ` — ${a.pincode}` : ""}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {!useNew && addresses.length === 0 && isLoggedIn && (
                <p className="text-sm text-neutral-500">No saved addresses yet — add one below.</p>
              )}
              <button onClick={() => setUseNew((v) => !v)} className="text-sm font-bold text-brand hover:text-brand-dark">
                {useNew ? "← Use saved address" : "+ Add New Address"}
              </button>

              {useNew && (
                <div className="grid gap-4 rounded-card border border-black/5 bg-white p-3.5 lg:p-5 shadow-card sm:grid-cols-2">
                  <Field label="Full Name"><input value={form.name} onChange={(e) => setField("name", e.target.value)} className={inputCls} placeholder="Full name" /></Field>
                  <Field label="Phone"><input value={form.phone} onChange={(e) => setField("phone", e.target.value)} className={inputCls} placeholder="+91" /></Field>
                  <Field label="Email"><input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} className={inputCls} placeholder="you@email.com" /></Field>
                  <Field label="Pincode"><input value={form.pincode} onChange={(e) => setField("pincode", e.target.value)} className={inputCls} placeholder="560001" /></Field>
                  <div className="sm:col-span-2"><Field label="Address Line 1"><input value={form.line1} onChange={(e) => setField("line1", e.target.value)} className={inputCls} placeholder="House no., building, street" /></Field></div>
                  <div className="sm:col-span-2"><Field label="Address Line 2" optional><input value={form.line2} onChange={(e) => setField("line2", e.target.value)} className={inputCls} placeholder="Area, landmark" /></Field></div>
                  <Field label="City"><input value={form.city} onChange={(e) => setField("city", e.target.value)} className={inputCls} placeholder="City" /></Field>
                  <Field label="State">
                    <select value={form.state} onChange={(e) => setField("state", e.target.value)} className={inputCls}>
                      {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </Field>
                  {isLoggedIn && (
                    <label className="flex items-center gap-2 text-sm text-neutral-600 sm:col-span-2">
                      <input type="checkbox" checked={saveAddr} onChange={(e) => setSaveAddr(e.target.checked)} className="h-4 w-4 rounded accent-brand" /> Save this address for next time
                    </label>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* payment */}
          <section>
            <h2 className="text-base lg:text-lg font-bold text-ink">Payment Method</h2>
            <div className="mt-4 space-y-3">
              {methods.map((m) => (
                <Radio key={m.id} id={m.id} label={m.label} disabled={m.id === "cod" && !codAllowed}>
                  {m.id === "online" && (
                    <p className="text-[13px] text-neutral-600">
                      Card, UPI, Net Banking and Wallets are all available in the secure payment window after you click Place Order.
                    </p>
                  )}
                  {/* COD keeps its info box. Razorpay collects every payment detail after Place Order. */}
                  {m.id === "cod" && (
                    codAllowed ? (
                      <div className="rounded-lg border border-brand/20 bg-brand-softer p-4 text-[13px] leading-relaxed text-ink">
                        <p className="font-bold text-brand">Cash on Delivery selected</p>
                        <p className="mt-1">
                          Pay {formatINR(COD_ADVANCE)} now to confirm your order. Remaining{" "}
                          <span className="font-bold">{formatINR(codRemaining)}</span> will be collected at delivery by our courier partner.
                        </p>
                      </div>
                    ) : (
                      <p className="text-[13px] font-medium text-neutral-500">
                        COD available on orders up to {formatINR(COD_LIMIT)} only
                      </p>
                    )
                  )}
                </Radio>
              ))}
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-lg bg-neutral-50 px-3.5 py-3 text-[13px] text-neutral-600">
              <span aria-hidden="true">🔒</span>
              <span>Payment details are collected securely by our payment partner. You will be redirected to complete payment after clicking Place Order.</span>
            </div>
          </section>
        </div>

        {/* ── right: sticky summary (desktop) ── */}
        <aside className="hidden lg:block">
          <div className="rounded-card border border-black/5 bg-white p-4 lg:p-6 shadow-card lg:sticky lg:top-[124px]">
            <h2 className="mb-4 text-base lg:text-lg font-bold text-ink">Order Summary</h2>
            <Summary />
          </div>
        </aside>
      </div>

      {/* mobile sticky place-order bar — safe-area aware (clears the home indicator) */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] lg:hidden"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <button onClick={placeOrder} disabled={placing} className="flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-bold text-white disabled:opacity-50">
          <LockIcon style={{ width: 16, height: 16 }} /> {placing ? "Placing order…" : payLabel}
        </button>
      </div>
    </div>
  );
}
