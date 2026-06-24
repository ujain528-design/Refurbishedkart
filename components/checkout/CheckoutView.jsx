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

const FREE_DELIVERY_ABOVE = 7999;
const DELIVERY_FEE = 199;
const COD_LIMIT = 29999;    // COD available up to this order total (inclusive)
const COD_UPFRONT_PCT = 0.1; // 10% charged upfront, 90% collected on delivery

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

// ── New-address validation ──
const PHONE_RE = /^[6-9]\d{9}$/;                 // 10-digit Indian mobile, starts 6–9
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PIN_RE = /^\d{6}$/;
const onlyDigits = (s) => String(s || "").replace(/\D/g, "");

/* Normalise an Indian phone to its bare 10 digits: strip spaces/dashes/parens and
   a leading +91 / 91 / 0, so "98765 43210" and "+91-9876543210" both reduce to
   "9876543210". */
const stripPhone = (raw) => {
  let s = String(raw || "").replace(/[\s\-()]/g, "").replace(/^\+/, "");
  s = s.replace(/\D/g, "");
  if (s.length === 12 && s.startsWith("91")) s = s.slice(2); // +91 / 91 prefix
  if (s.length === 11 && s.startsWith("0")) s = s.slice(1);  // leading 0
  return s;
};

/* Returns a { field: message } map of errors (empty = valid). Used both on
   Place Order and to render inline messages per field. */
function validateAddressForm(f) {
  const e = {};
  if (!String(f.name || "").trim()) e.name = "Enter the full name.";
  if (!PHONE_RE.test(stripPhone(f.phone))) e.phone = "Please enter a valid 10-digit Indian mobile number.";
  const email = String(f.email || "").trim();
  if (!email) e.email = "Enter an email address.";
  else if (!EMAIL_RE.test(email)) e.email = "Enter a valid email address.";
  if (!String(f.line1 || "").trim()) e.line1 = "Enter your address.";
  const pin = onlyDigits(f.pincode);
  if (!pin) e.pincode = "Enter a 6-digit pincode.";
  else if (!PIN_RE.test(pin)) e.pincode = "Pincode must be exactly 6 digits.";
  if (!String(f.city || "").trim()) e.city = "City is required.";
  if (!String(f.state || "").trim()) e.state = "State is required.";
  return e;
}

function Field({ label, optional, required, error, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-semibold text-neutral-600">
        {label}
        {required && <span className="text-red-500"> *</span>}
        {optional && <span className="font-normal text-neutral-400"> (optional)</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-[11px] font-semibold text-red-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-[11px] text-neutral-400">{hint}</span>
      ) : null}
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

/* Collapsed-by-default "What's in the box?" toggle for an order-summary line.
   Renders nothing when the product has no whatsInBox data. */
function BoxContents({ raw }) {
  const [open, setOpen] = useState(false);
  const list = String(raw || "").split("\n").map((s) => s.trim()).filter(Boolean);
  if (!list.length) return null;
  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-1 text-[12px] font-semibold text-brand hover:text-brand-dark"
      >
        📦 What&apos;s in the box?
        <ChevronDown style={{ width: 12, height: 12 }} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul className="mt-1.5 space-y-1">
          {list.map((b, i) => (
            <li key={i} className="flex items-start gap-1.5 text-[12px] leading-snug text-neutral-500">
              <span className="text-brand">✓</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

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
  const [codModalOpen, setCodModalOpen] = useState(false); // COD terms consent modal
  const [codAgreed, setCodAgreed] = useState(false);       // consent checkbox
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

  const [fieldErrors, setFieldErrors] = useState({}); // per-field inline errors
  const [pinLoading, setPinLoading] = useState(false); // India Post lookup in flight
  const [addrLock, setAddrLock] = useState(false);     // city/state locked after auto-fill
  const [whatsappOptIn, setWhatsappOptIn] = useState(true); // pre-checked WhatsApp updates opt-in

  // Editing a field clears its inline error.
  const setField = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setFieldErrors((e) => (e[k] ? { ...e, [k]: undefined } : e));
  };

  /* Auto-fill City + State from a 6-digit pincode via the free India Post API
     (no key). Locks the two fields on success (editable via "Edit"); shows an
     inline error and clears them on an invalid/not-found pincode. */
  const lookupPincode = async (raw) => {
    const code = onlyDigits(raw);
    if (code.length !== 6) return;
    setPinLoading(true);
    setFieldErrors((e) => ({ ...e, pincode: undefined }));
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${code}`);
      const data = await res.json();
      const rec = Array.isArray(data) ? data[0] : null;
      const po = rec?.Status === "Success" && Array.isArray(rec.PostOffice) ? rec.PostOffice[0] : null;
      if (po) {
        setForm((f) => ({ ...f, city: po.District || f.city, state: po.State || f.state }));
        setFieldErrors((e) => ({ ...e, pincode: undefined, city: undefined, state: undefined }));
        setAddrLock(true);
      } else {
        setForm((f) => ({ ...f, city: "", state: "" }));
        setFieldErrors((e) => ({ ...e, pincode: "Invalid pincode — please check." }));
        setAddrLock(false);
      }
    } catch {
      setFieldErrors((e) => ({ ...e, pincode: "Couldn't verify pincode — check your connection." }));
      setAddrLock(false);
    } finally {
      setPinLoading(false);
    }
  };
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

  // Shipping is free at/above the threshold on the PRODUCT total (after discount);
  // below it a flat fee applies. ₹7,999 exactly ships free (inclusive).
  const productTotal = subtotal - discount;
  const delivery = productTotal >= rules.freeDeliveryAbove ? 0 : rules.deliveryFee;
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
  const grandTotal = productTotal + delivery;
  const codAllowed = grandTotal <= COD_LIMIT;
  const isCod = pay === "cod" && codAllowed;
  // COD upfront = 10% of the product total (rounded up) PLUS the full shipping fee;
  // the balance is collected on delivery.
  const codUpfront = Math.ceil(productTotal * COD_UPFRONT_PCT) + delivery;
  const codRemaining = grandTotal - codUpfront;
  const baseLabel = isCod ? "Place Order with COD" : `Pay ${formatINR(grandTotal)} & Place Order`;
  // Main CTA is always "Place Order" — retry is its own button (shown only after a
  // genuine payment failure, see canRetry).
  const payLabel = baseLabel;
  const canRetry = !!pendingOrder && !!orderError;
  const retryPayment = () => { if (!placing && pendingOrder) startPayment(pendingOrder); };
  const methods = PAYMENT_METHODS; // COD always visible (disabled above the limit)

  /* Open Razorpay for an order. Non-COD pays the full total; COD pays the ₹500
     advance. On verified success: clear cart + go to confirmation. On
     failure/dismiss: keep the order (pending_payment), preserve cart, allow retry. */
  const startPayment = async (order) => {
    setPlacing(true);
    setOrderError("");
    try {
      // COD pays the 10% upfront (authoritative value comes back on the created order);
      // online pays the full total.
      const payAmount = order.paymentMethod === "COD" ? (order.codUpfront ?? codUpfront) : grandTotal;
      const created = await createRazorpayOrder(order.id, payAmount);
      const ok = await loadRazorpay();
      // Make every "gateway didn't open" cause VISIBLE instead of a silent no-op.
      if (!ok || typeof window === "undefined" || !window.Razorpay) {
        throw new Error("Couldn't load the payment gateway. Check your connection and try again.");
      }
      if (!created || !created.keyId || !created.razorpayOrderId) {
        throw new Error("Payment couldn't be initialised — the gateway isn't configured. Please try again or contact support.");
      }

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
        // Closed the modal without paying → send them to the payment-pending page,
        // where a 30-min countdown + "Pay Now" let them finish (or it auto-cancels).
        modal: { ondismiss: () => { setPlacing(false); router.push(`/payment-pending?orderId=${order.id}`); } },
      });
      rzp.on("payment.failed", (r) => { setOrderError(r?.error?.description || "Payment failed. Your order is saved — retry."); setPlacing(false); });
      rzp.open();
    } catch (e) {
      setOrderError(e.message || "Couldn't start payment.");
      setPlacing(false);
    }
  };

  // Place Order ALWAYS creates a fresh order + opens Razorpay. Retrying a
  // previously-failed payment is a separate, explicit action (retryPayment below).
  const placeOrder = async () => {
    if (placing) return; // in progress (button is also disabled while placing)
    setOrderError("");

    // ── Resolve the shipping address. Every failure path sets a VISIBLE error and
    //    returns — never a silent stop. ──
    let shippingAddress;
    if (useNew) {
      const errs = validateAddressForm(form);
      if (Object.keys(errs).length) {
        setFieldErrors(errs);
        setOrderError("Please fix the highlighted fields in the delivery address.");
        return;
      }
      setFieldErrors({});
      // Normalise phone (bare 10 digits) + pincode for the order.
      shippingAddress = { ...form, phone: stripPhone(form.phone), pincode: onlyDigits(form.pincode) };
    } else if (selectedAddr) {
      shippingAddress = selectedAddr;
    } else {
      setOrderError("Please select a delivery address, or choose “Add a new address”.");
      return;
    }

    // ── Cart sanity ──
    const lineItems = orderItems();
    if (!lineItems || lineItems.length === 0) {
      setOrderError("Your cart is empty — add an item before checking out.");
      return;
    }

    setPlacing(true);
    try {
      if (useNew && saveAddr && isLoggedIn) { try { await addAddress(form); } catch {} }
      // Server recomputes every price — client totals are never trusted (PRD §5.3).
      const order = await createOrder({
        items: lineItems,
        // whatsappOptIn stored inside the (free-form) shippingAddress so it persists
        // regardless of the Order schema, plus top-level for any route-level handling.
        shippingAddress: { ...shippingAddress, whatsappOptIn },
        whatsappOptIn,
        // "ONLINE" is a placeholder; the verify route overwrites it with the real
        // instrument (card/upi/netbanking/wallet) read from Razorpay. COD stays "COD".
        paymentMethod: pay === "cod" ? "COD" : "ONLINE",
        couponCode: coupon?.code || null,
        buyerGstin: gstin || null,
      });
      if (!order || !order.id) {
        throw new Error("The order couldn't be created on the server. Please try again.");
      }
      setPendingOrder(order);
      await startPayment(order); // opens Razorpay
    } catch (e) {
      setOrderError(e?.message || "Couldn't place the order. Please try again.");
      setPlacing(false); // stay on page, preserve form + cart
    }
  };

  // Place-order click gate: COD requires the customer to accept the COD terms in a
  // consent modal first. Online orders go straight through.
  const onPlaceClick = () => {
    if (placing) return;
    if (isCod) { setCodAgreed(false); setCodModalOpen(true); return; }
    placeOrder();
  };
  const confirmCod = () => { setCodModalOpen(false); placeOrder(); };

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
              <BoxContents raw={it.whatsInBox} />
            </div>
            <p className="text-[13px] font-bold text-ink">{formatINR(it.unitPrice * it.qty)}</p>
          </div>
        ))}
      </div>

      <dl className="space-y-2.5 border-t border-black/5 pt-4 text-sm">
        {/* 1. Subtotal */}
        <div className="flex justify-between"><dt className="text-neutral-500">Subtotal</dt><dd className="font-semibold text-ink">{formatINR(subtotal)}</dd></div>

        {/* 2. Shipping */}
        <div className="flex justify-between"><dt className="text-neutral-500">Shipping</dt><dd className="font-semibold text-ink">{delivery === 0 ? <span className="text-brand">FREE</span> : formatINR(delivery)}</dd></div>

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
          <div className="flex justify-between"><span className="text-neutral-600">Shipping</span><span className="font-semibold text-ink">{delivery === 0 ? <span className="text-brand">FREE</span> : formatINR(delivery)}</span></div>
          <div className="flex justify-between"><span className="text-neutral-600">Pay now (10%{delivery ? " + shipping" : ""})</span><span className="font-semibold text-brand">{formatINR(codUpfront)}</span></div>
          <div className="flex justify-between"><span className="text-neutral-600">Pay on delivery</span><span className="font-semibold text-ink">{formatINR(codRemaining)}</span></div>
          <div className="flex justify-between border-t border-brand/15 pt-2"><span className="font-semibold text-ink">Total</span><span className="font-bold text-ink">{formatINR(grandTotal)}</span></div>
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
      {/* Explicit retry — only after a genuine payment failure on an already-created
          order. Re-opens Razorpay for that same order instead of creating a new one. */}
      {canRetry && (
        <button
          onClick={retryPayment}
          disabled={placing}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-brand py-2.5 lg:py-3 text-sm font-bold text-brand transition-colors hover:bg-brand-softer disabled:opacity-50"
        >
          {placing ? "Opening payment…" : "Retry Payment for this order"}
        </button>
      )}
      <button
        onClick={onPlaceClick}
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
        {summaryOpen && <div className="mt-3 rounded-card border border-black/5 bg-white p-3.5 lg:p-5 shadow-card">{Summary()}</div>}
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
                  <Field label="Full Name" required error={fieldErrors.name}>
                    <input value={form.name} onChange={(e) => setField("name", e.target.value)} className={inputCls} placeholder="Full name" autoComplete="name" />
                  </Field>
                  <Field label="Phone" required error={fieldErrors.phone}>
                    <input type="tel" inputMode="tel" maxLength={16} value={form.phone}
                      onChange={(e) => setField("phone", e.target.value.replace(/[^\d+\-\s]/g, ""))}
                      className={inputCls} placeholder="+91 98765 43210" autoComplete="tel" />
                  </Field>
                  {/* WhatsApp opt-in — full-width row directly below the phone field */}
                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-2 text-[13px] font-medium text-ink">
                      <input type="checkbox" checked={whatsappOptIn} onChange={(e) => setWhatsappOptIn(e.target.checked)} className="h-4 w-4 rounded accent-brand" />
                      Send order updates on WhatsApp ✓
                    </label>
                    <p className="mt-0.5 pl-6 text-[11px] text-neutral-400">We&apos;ll send shipping updates on WhatsApp</p>
                  </div>
                  <Field label="Email" required error={fieldErrors.email}>
                    <input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} className={inputCls} placeholder="you@email.com" autoComplete="email" />
                  </Field>
                  <Field label="Pincode" required error={fieldErrors.pincode} hint={pinLoading ? "Looking up city & state…" : undefined}>
                    <input type="text" inputMode="numeric" maxLength={6} value={form.pincode}
                      onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 6); setField("pincode", v); if (v.length === 6) lookupPincode(v); }}
                      onBlur={(e) => lookupPincode(e.target.value)}
                      className={inputCls} placeholder="6-digit pincode" autoComplete="postal-code" />
                  </Field>
                  <div className="sm:col-span-2"><Field label="Address Line 1" required error={fieldErrors.line1}>
                    <input value={form.line1} onChange={(e) => setField("line1", e.target.value)} className={inputCls} placeholder="House no., building, street" autoComplete="address-line1" />
                  </Field></div>
                  <div className="sm:col-span-2"><Field label="Address Line 2" optional>
                    <input value={form.line2} onChange={(e) => setField("line2", e.target.value)} className={inputCls} placeholder="Area, landmark" autoComplete="address-line2" />
                  </Field></div>
                  <Field label="City" required error={fieldErrors.city} hint={addrLock ? "Auto-filled from pincode" : undefined}>
                    <input value={form.city} readOnly={addrLock} onChange={(e) => setField("city", e.target.value)}
                      className={`${inputCls} ${addrLock ? "bg-neutral-50 text-neutral-600" : ""}`} placeholder="City" autoComplete="address-level2" />
                  </Field>
                  <Field label="State" required error={fieldErrors.state} hint={addrLock ? "Auto-filled from pincode" : undefined}>
                    <select value={form.state} disabled={addrLock} onChange={(e) => setField("state", e.target.value)}
                      className={`${inputCls} ${addrLock ? "bg-neutral-50 text-neutral-600" : ""}`}>
                      <option value="">Select state</option>
                      {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </Field>
                  {addrLock && (
                    <button type="button" onClick={() => setAddrLock(false)} className="-mt-1 justify-self-start text-[12px] font-semibold text-brand underline sm:col-span-2">
                      Edit city / state manually
                    </button>
                  )}
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
                          Pay {formatINR(codUpfront)} now (10%{delivery ? " + shipping" : ""}) to confirm your order. The remaining{" "}
                          <span className="font-bold">{formatINR(codRemaining)}</span> is collected at delivery by our courier partner.
                        </p>
                      </div>
                    ) : (
                      <p className="text-[13px] font-medium text-neutral-500">
                        Not available for orders above {formatINR(COD_LIMIT)}
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
            {Summary()}
          </div>
        </aside>
      </div>

      {/* mobile sticky place-order bar — safe-area aware (clears the home indicator) */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] lg:hidden"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <button onClick={onPlaceClick} disabled={placing} className="flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-bold text-white disabled:opacity-50">
          <LockIcon style={{ width: 16, height: 16 }} /> {placing ? "Placing order…" : payLabel}
        </button>
      </div>

      {/* ── COD terms consent modal (Part F) ── */}
      {codModalOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cod-modal-title"
          onClick={() => setCodModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-100 text-2xl text-amber-600" aria-hidden="true">⚠</span>
              <h3 id="cod-modal-title" className="mt-3 text-base font-bold text-ink">Cash on Delivery — Please Note</h3>
            </div>

            <div className="mt-4 space-y-3 text-[13px] leading-relaxed text-neutral-600">
              <p>By placing a COD order, you agree to the following:</p>
              <ul className="space-y-2">
                <li className="flex gap-2">
                  <span className="text-amber-500" aria-hidden="true">•</span>
                  <span>An upfront amount of <span className="font-bold text-ink">{formatINR(codUpfront)}</span> (10% of order value{delivery ? " + shipping" : ""}) is charged now and is <span className="font-semibold text-ink">non-refundable</span> in case of non-delivery.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-500" aria-hidden="true">•</span>
                  <span>
                    In case of failed delivery due to a wrong address, customer unavailability, or refusal to accept delivery, both-side courier charges will be deducted from your <span className="font-bold text-ink">{formatINR(codUpfront)}</span> upfront payment. Any remaining amount will be refunded to your original payment method.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-500" aria-hidden="true">•</span>
                  <span>Please ensure your delivery address and phone number are correct before confirming.</span>
                </li>
              </ul>
            </div>

            <label className="mt-4 flex items-start gap-3 rounded-lg border border-black/10 bg-neutral-50 p-3 text-[13px] font-medium text-ink">
              <input
                type="checkbox"
                checked={codAgreed}
                onChange={(e) => setCodAgreed(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 rounded accent-brand"
              />
              <span>I understand and agree to the COD terms</span>
            </label>

            <button
              onClick={confirmCod}
              disabled={!codAgreed || placing}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3 text-sm font-bold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {placing ? "Placing order…" : "Confirm & Place COD Order"}
            </button>
            <button
              onClick={() => setCodModalOpen(false)}
              className="mt-2 w-full py-2 text-center text-[13px] font-semibold text-neutral-500 hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
