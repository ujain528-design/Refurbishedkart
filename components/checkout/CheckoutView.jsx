"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/CartContext";
import { formatINR, INDIAN_STATES, SELLER_STATE, gstBreakup } from "@/lib/data";
import { BrokenDeviceIcon, LockIcon, ShieldIcon, ReturnIcon, ClipboardIcon, ChevronDown } from "@/components/Icons";

const FREE_DELIVERY_ABOVE = 999;
const DELIVERY_FEE = 99;
const COD_LIMIT = 29999; // COD available up to this order total
const COD_ADVANCE = 500; // advance paid now to confirm a COD order
const COD_ADVANCE_METHODS = ["UPI", "Card", "Wallet"];

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

const PAYMENT_METHODS = [
  { id: "upi", label: "UPI" },
  { id: "card", label: "Credit / Debit Card" },
  { id: "netbanking", label: "Net Banking" },
  { id: "wallet", label: "Wallets" },
  { id: "cod", label: "Cash on Delivery" },
];

const BANKS = ["HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank", "Kotak Mahindra Bank", "Punjab National Bank"];
const WALLETS = ["Paytm", "PhonePe", "Amazon Pay"];

export default function CheckoutView() {
  const { ready, items, subtotal, discount, coupon, checkout } = useCart();
  const router = useRouter();

  const [useNew, setUseNew] = useState(false);
  const [state, setState] = useState(SAVED_ADDRESS.state);
  const [pay, setPay] = useState("upi");
  const [wallet, setWallet] = useState(WALLETS[0]);
  const [codAdvance, setCodAdvance] = useState(COD_ADVANCE_METHODS[0]);
  const [gstin, setGstin] = useState("");
  const [summaryOpen, setSummaryOpen] = useState(false); // mobile
  const [gstOpen, setGstOpen] = useState(true);

  if (!ready) return <div className="py-24 text-center text-sm text-neutral-400">Loading…</div>;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Your cart is empty</h1>
        <p className="mt-2 text-sm text-neutral-500">Add an item before checking out.</p>
        <Link href="/products/laptops" className="mt-7 inline-block rounded-full bg-brand px-7 py-3 text-sm font-bold text-white hover:bg-brand-dark">
          Continue Shopping
        </Link>
      </div>
    );
  }

  const delivery = subtotal > FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE;
  const goods = subtotal - discount;
  const interState = state !== SELLER_STATE;
  const gst = gstBreakup(goods, interState);
  const grandTotal = subtotal - discount + delivery;
  const codAllowed = grandTotal <= COD_LIMIT;
  const isCod = pay === "cod" && codAllowed;
  const codRemaining = grandTotal - COD_ADVANCE;
  const payLabel = isCod ? `Pay ${formatINR(COD_ADVANCE)} & Confirm Order` : `Pay ${formatINR(grandTotal)} & Place Order`;
  const methods = PAYMENT_METHODS; // COD always visible (disabled above the limit)

  const placeOrder = () => {
    checkout();
    router.push("/order-confirmation");
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
      <label className={`flex items-center gap-3 px-4 py-3.5 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}>
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
                {it.ram ? `${it.ram}GB` : ""}{it.ram && it.ssd ? " · " : ""}{it.ssd ? `${it.ssd}` : ""} · Qty {it.qty}
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

        {/* 3. Coupon discount */}
        {coupon && <div className="flex justify-between"><dt className="text-brand">Discount ({coupon.value}%)</dt><dd className="font-semibold text-brand">− {formatINR(discount)}</dd></div>}

        {/* 4. Amount after discount */}
        <div className="flex justify-between border-t border-black/5 pt-2.5"><dt className="text-neutral-500">Amount after discount</dt><dd className="font-semibold text-ink">{formatINR(goods)}</dd></div>

        {/* 5. GST breakup — collapsible (default open), extracted from amount after discount */}
        <div>
          <button onClick={() => setGstOpen((v) => !v)} className="flex w-full items-center justify-between text-neutral-500">
            <span>GST (included above)</span>
            <ChevronDown style={{ width: 14, height: 14 }} className={`transition-transform ${gstOpen ? "rotate-180" : ""}`} />
          </button>
          {gstOpen && (
            <div className="mt-1.5 space-y-1 pl-3 text-[13px] text-neutral-400">
              {interState ? (
                <div className="flex justify-between"><span>IGST 18%</span><span>{formatINR(gst.igst)}</span></div>
              ) : (
                <>
                  <div className="flex justify-between"><span>CGST 9%</span><span>{formatINR(gst.cgst)}</span></div>
                  <div className="flex justify-between"><span>SGST 9%</span><span>{formatINR(gst.sgst)}</span></div>
                </>
              )}
            </div>
          )}
        </div>
      </dl>

      {/* 6. Grand Total */}
      <div className="flex items-baseline justify-between border-t border-black/5 pt-4">
        <span className="text-base font-bold text-ink">Grand Total</span>
        <span className="text-2xl font-extrabold tracking-tight text-brand">{formatINR(grandTotal)}</span>
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

      <button onClick={placeOrder} className="flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3.5 text-sm font-bold text-white transition-colors hover:bg-brand-dark">
        <LockIcon style={{ width: 16, height: 16 }} />
        {payLabel}
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
        {summaryOpen && <div className="mt-3 rounded-card border border-black/5 bg-white p-5 shadow-card"><Summary /></div>}
      </div>

      <div className="mt-6 gap-8 lg:grid lg:grid-cols-[1fr_minmax(340px,40%)]">
        {/* ── left: address + payment ── */}
        <div className="space-y-8 pb-28 lg:pb-0">
          {/* address */}
          <section>
            <h2 className="text-lg font-bold text-ink">Delivery Address</h2>
            <div className="mt-4 space-y-3">
              {!useNew && (
                <div className="rounded-card border-2 border-brand bg-brand-softer/40 p-4">
                  <div className="flex items-start gap-3">
                    <input type="radio" checked readOnly className="mt-1 h-4 w-4 accent-brand" />
                    <div className="text-sm">
                      <p className="font-bold text-ink">{SAVED_ADDRESS.name} · {SAVED_ADDRESS.phone}</p>
                      <p className="mt-0.5 text-neutral-500">{SAVED_ADDRESS.line}, {SAVED_ADDRESS.city}, {SAVED_ADDRESS.state} — {SAVED_ADDRESS.pincode}</p>
                    </div>
                  </div>
                </div>
              )}
              <button onClick={() => setUseNew((v) => !v)} className="text-sm font-bold text-brand hover:text-brand-dark">
                {useNew ? "← Use saved address" : "+ Add New Address"}
              </button>

              {useNew && (
                <div className="grid gap-4 rounded-card border border-black/5 bg-white p-5 shadow-card sm:grid-cols-2">
                  <Field label="Full Name"><input className={inputCls} placeholder="Full name" /></Field>
                  <Field label="Phone"><input className={inputCls} placeholder="+91" /></Field>
                  <Field label="Email"><input type="email" className={inputCls} placeholder="you@email.com" /></Field>
                  <Field label="Pincode"><input className={inputCls} placeholder="560001" /></Field>
                  <div className="sm:col-span-2"><Field label="Address Line 1"><input className={inputCls} placeholder="House no., building, street" /></Field></div>
                  <div className="sm:col-span-2"><Field label="Address Line 2" optional><input className={inputCls} placeholder="Area, landmark" /></Field></div>
                  <Field label="City"><input className={inputCls} placeholder="City" /></Field>
                  <Field label="State">
                    <select value={state} onChange={(e) => setState(e.target.value)} className={inputCls}>
                      {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </Field>
                  <label className="flex items-center gap-2 text-sm text-neutral-600 sm:col-span-2">
                    <input type="checkbox" className="h-4 w-4 rounded accent-brand" /> Save this address for next time
                  </label>
                </div>
              )}
            </div>
          </section>

          {/* payment */}
          <section>
            <h2 className="text-lg font-bold text-ink">Payment Method</h2>
            <div className="mt-4 space-y-3">
              {methods.map((m) => (
                <Radio key={m.id} id={m.id} label={m.label} disabled={m.id === "cod" && !codAllowed}>
                  {m.id === "upi" && <input className={inputCls} placeholder="yourname@upi" />}
                  {m.id === "card" && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2"><input className={inputCls} placeholder="Card number" /></div>
                      <input className={inputCls} placeholder="MM / YY" />
                      <input className={inputCls} placeholder="CVV" />
                    </div>
                  )}
                  {m.id === "netbanking" && (
                    <select className={inputCls} defaultValue="">
                      <option value="" disabled>Select your bank</option>
                      {BANKS.map((b) => <option key={b}>{b}</option>)}
                    </select>
                  )}
                  {m.id === "wallet" && (
                    <div className="flex flex-wrap gap-2">
                      {WALLETS.map((w) => (
                        <button key={w} onClick={() => setWallet(w)} className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${wallet === w ? "border-brand bg-brand text-white" : "border-black/10 text-ink hover:border-brand"}`}>{w}</button>
                      ))}
                    </div>
                  )}
                  {m.id === "cod" && (
                    codAllowed ? (
                      <div className="space-y-4">
                        {/* highlighted info box */}
                        <div className="rounded-lg border border-brand/20 bg-brand-softer p-4 text-[13px] leading-relaxed text-ink">
                          <p className="font-bold text-brand">Cash on Delivery selected</p>
                          <p className="mt-1">
                            Pay {formatINR(COD_ADVANCE)} now to confirm your order. Remaining{" "}
                            <span className="font-bold">{formatINR(codRemaining)}</span> will be collected at delivery by our courier partner.
                          </p>
                        </div>
                        {/* advance payment sub-options */}
                        <div>
                          <p className="mb-2 text-[12px] font-semibold text-neutral-600">
                            Pay {formatINR(COD_ADVANCE)} advance via
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {COD_ADVANCE_METHODS.map((opt) => (
                              <button
                                key={opt}
                                onClick={() => setCodAdvance(opt)}
                                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                                  codAdvance === opt ? "border-brand bg-brand text-white" : "border-black/10 text-ink hover:border-brand"
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
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
          </section>
        </div>

        {/* ── right: sticky summary (desktop) ── */}
        <aside className="hidden lg:block">
          <div className="rounded-card border border-black/5 bg-white p-6 shadow-card lg:sticky lg:top-[124px]">
            <h2 className="mb-4 text-lg font-bold text-ink">Order Summary</h2>
            <Summary />
          </div>
        </aside>
      </div>

      {/* mobile sticky place-order bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] lg:hidden">
        <button onClick={placeOrder} className="flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-bold text-white">
          <LockIcon style={{ width: 16, height: 16 }} /> {payLabel}
        </button>
      </div>
    </div>
  );
}
