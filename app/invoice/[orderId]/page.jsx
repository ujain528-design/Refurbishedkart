"use client";

import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";
import { computeLineTaxes, SELLER_STATE } from "@/lib/data";

/* Print-friendly GST tax invoice. Client-rendered so it works for BOTH admin
   (session cookie) and customer (Bearer from localStorage): the data fetch below
   sends the Bearer when present and the cookie is attached automatically, and the
   API authorizes either. Print CSS hides all app chrome (announcement bar etc.). */

const BASE = process.env.NEXT_PUBLIC_API_URL || "";
const inr = (n) => "₹" + (Math.round(Number(n) || 0)).toLocaleString("en-IN");
const lc = (s) => String(s ?? "").trim().toLowerCase();
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");

// Integer rupees → words (Indian numbering: crore / lakh / thousand).
function amountInWords(value) {
  let num = Math.round(Number(value) || 0);
  if (num === 0) return "Zero";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const twoDigit = (n) => (n < 20 ? ones[n] : tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : ""));
  const threeDigit = (n) => {
    const h = Math.floor(n / 100), r = n % 100;
    return (h ? ones[h] + " Hundred" + (r ? " " : "") : "") + (r ? twoDigit(r) : "");
  };
  const parts = [];
  const crore = Math.floor(num / 10000000); num %= 10000000;
  const lakh = Math.floor(num / 100000); num %= 100000;
  const thousand = Math.floor(num / 1000); num %= 1000;
  const hundred = num;
  if (crore) parts.push(threeDigit(crore) + " Crore");
  if (lakh) parts.push(twoDigit(lakh) + " Lakh");
  if (thousand) parts.push(twoDigit(thousand) + " Thousand");
  if (hundred) parts.push(threeDigit(hundred));
  return parts.join(" ").trim();
}

const PRINT_CSS = `
@media print {
  body * { visibility: hidden !important; }
  #invoice-print, #invoice-print * { visibility: visible !important; }
  #invoice-print { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
  .no-print { display: none !important; }
}
`;

export default function InvoicePage({ params }) {
  const orderId = params.orderId;
  const [state, setState] = useState({ status: "loading", order: null, seller: null, error: "" });

  useEffect(() => {
    let alive = true;
    const token = getToken();
    fetch(`${BASE}/api/invoices/${orderId}/data`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
    })
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (!res.ok) throw new Error(body?.error || `Couldn't load invoice (${res.status})`);
        return body;
      })
      .then((d) => { if (alive) setState({ status: "ready", order: d.order, seller: d.seller, error: "" }); })
      .catch((e) => { if (alive) setState({ status: "error", order: null, seller: null, error: e.message }); });
    return () => { alive = false; };
  }, [orderId]);

  if (state.status === "loading") return <div style={{ padding: 40, fontFamily: "system-ui", color: "#666" }}>Loading invoice…</div>;
  if (state.status === "error") return <div style={{ padding: 40, fontFamily: "system-ui", color: "#b00" }}>{state.error}</div>;

  const { order, seller } = state;
  const addr = order.shippingAddress || {};
  const interState = lc(addr.state) !== lc(SELLER_STATE);
  const discount = Number(order.discount) || 0;
  const ct = computeLineTaxes(order.lines || [], discount, interState, Number(order.gstRate) || 18);
  const shipping = Number(order.shippingCharge ?? order.delivery ?? 0) || 0;
  const grandTotal = Number(order.total) || ct.taxableExcl + ct.totalTax + shipping;
  const rate = (order.lines?.[0]?.gstRate && Number(order.lines[0].gstRate)) || 18;
  const invoiceNo = order.invoiceNumber || order.orderId;

  const cellL = { padding: "6px 8px", textAlign: "left", borderBottom: "1px solid #e5e5e5" };
  const cellR = { ...cellL, textAlign: "right" };
  const th = { padding: "7px 8px", textAlign: "left", background: "#f3f4f0", borderBottom: "2px solid #2d5016", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.03em" };
  const thR = { ...th, textAlign: "right" };

  return (
    <div style={{ background: "#f5f5f5", minHeight: "100vh", padding: "24px 12px" }}>
      <style>{PRINT_CSS}</style>

      <div className="no-print" style={{ maxWidth: 820, margin: "0 auto 14px", display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button onClick={() => window.print()} style={{ background: "#2d5016", color: "#fff", border: 0, borderRadius: 999, padding: "10px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
          🖨 Print / Save PDF
        </button>
      </div>

      <div
        id="invoice-print"
        style={{ maxWidth: 820, margin: "0 auto", background: "#fff", padding: "34px 40px", boxShadow: "0 2px 16px rgba(0,0,0,0.08)", fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif", color: "#1c1c1e", fontSize: 13, lineHeight: 1.5 }}
      >
        {/* Seller header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, borderBottom: "2px solid #2d5016", paddingBottom: 16 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#2d5016", letterSpacing: "-0.02em" }}>RefurbishedKart</div>
            <div style={{ marginTop: 4, fontWeight: 600 }}>Resource E Waste Solutions Pvt Ltd</div>
            <div style={{ color: "#555", marginTop: 2 }}>147, Patparganj Industrial Area,<br />East Delhi, Delhi - 110092</div>
            <div style={{ color: "#555", marginTop: 4 }}>GSTIN: <b>{seller.gstin || "—"}</b></div>
            <div style={{ color: "#555" }}>Phone: {seller.supportPhone} · {seller.supportEmail}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "0.04em" }}>TAX INVOICE</div>
            <div style={{ marginTop: 8, color: "#555" }}>Invoice No: <b style={{ color: "#1c1c1e" }}>{invoiceNo}</b></div>
            <div style={{ color: "#555" }}>Invoice Date: {fmtDate(order.invoiceDate || order.createdAt)}</div>
            <div style={{ color: "#555" }}>Order Date: {fmtDate(order.createdAt)}</div>
          </div>
        </div>

        {/* Bill to */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#2d5016", letterSpacing: "0.04em" }}>Bill To</div>
          <div style={{ marginTop: 4, fontWeight: 700 }}>{order.customerName || addr.name || "—"}</div>
          <div style={{ color: "#555" }}>
            {[addr.line1, addr.line2, addr.city, addr.state, addr.pincode].filter(Boolean).join(", ") || "—"}
          </div>
          {(addr.phone || addr.mobile) && <div style={{ color: "#555" }}>Phone: {addr.phone || addr.mobile}</div>}
          {addr.email && <div style={{ color: "#555" }}>Email: {addr.email}</div>}
          <div style={{ color: "#555", marginTop: 2 }}>Place of Supply: {addr.state || "—"} {interState ? "(Inter-state · IGST)" : "(Intra-state · CGST + SGST)"}</div>
        </div>

        {/* Items */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16, fontSize: 12 }}>
          <thead>
            <tr>
              <th style={th}>#</th>
              <th style={th}>Product</th>
              <th style={th}>HSN</th>
              <th style={thR}>Qty</th>
              <th style={thR}>Rate</th>
              <th style={thR}>Taxable</th>
              {interState
                ? <th style={thR}>IGST</th>
                : <><th style={thR}>CGST</th><th style={thR}>SGST</th></>}
              <th style={thR}>Total</th>
            </tr>
          </thead>
          <tbody>
            {ct.lines.map((l, i) => {
              const variant = [l.ram, l.ssd ? `${l.ssd} SSD` : ""].filter(Boolean).join(" · ");
              const cgst = Math.round(l.gstAmount / 2);
              return (
                <tr key={i}>
                  <td style={cellL}>{i + 1}</td>
                  <td style={cellL}>{l.name}{variant ? <span style={{ color: "#888" }}> ({variant})</span> : null}</td>
                  <td style={cellL}>{l.hsnCode || "—"}</td>
                  <td style={cellR}>{l.qty}</td>
                  <td style={cellR}>{inr(l.exclUnit)}</td>
                  <td style={cellR}>{inr(l.exclTotal)}</td>
                  {interState
                    ? <td style={cellR}>{inr(l.gstAmount)}</td>
                    : <><td style={cellR}>{inr(cgst)}</td><td style={cellR}>{inr(l.gstAmount - cgst)}</td></>}
                  <td style={cellR}>{inr(l.netIncl)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
          <table style={{ borderCollapse: "collapse", fontSize: 13, minWidth: 320 }}>
            <tbody>
              <tr><td style={{ padding: "3px 10px", color: "#555" }}>Gross Amount (incl. GST)</td><td style={{ padding: "3px 10px", textAlign: "right" }}>{inr(ct.subtotal)}</td></tr>
              {discount > 0 && (
                <tr><td style={{ padding: "3px 10px", color: "#2d5016" }}>Coupon Discount{order.couponCode ? ` (${order.couponCode})` : ""}</td><td style={{ padding: "3px 10px", textAlign: "right", color: "#2d5016" }}>− {inr(discount)}</td></tr>
              )}
              <tr><td style={{ padding: "3px 10px", color: "#555" }}>Taxable Value</td><td style={{ padding: "3px 10px", textAlign: "right" }}>{inr(ct.taxableExcl)}</td></tr>
              {interState
                ? <tr><td style={{ padding: "3px 10px", color: "#555" }}>IGST @ {rate}%</td><td style={{ padding: "3px 10px", textAlign: "right" }}>{inr(ct.gst.igst)}</td></tr>
                : <>
                    <tr><td style={{ padding: "3px 10px", color: "#555" }}>CGST @ {rate / 2}%</td><td style={{ padding: "3px 10px", textAlign: "right" }}>{inr(ct.gst.cgst)}</td></tr>
                    <tr><td style={{ padding: "3px 10px", color: "#555" }}>SGST @ {rate / 2}%</td><td style={{ padding: "3px 10px", textAlign: "right" }}>{inr(ct.gst.sgst)}</td></tr>
                  </>}
              <tr><td style={{ padding: "3px 10px", color: "#555" }}>Shipping</td><td style={{ padding: "3px 10px", textAlign: "right" }}>{shipping ? inr(shipping) : "FREE"}</td></tr>
              <tr style={{ borderTop: "2px solid #2d5016" }}>
                <td style={{ padding: "7px 10px", fontWeight: 800 }}>Grand Total</td>
                <td style={{ padding: "7px 10px", textAlign: "right", fontWeight: 800, color: "#2d5016", fontSize: 15 }}>{inr(grandTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {order.paymentMethod === "COD" && (order.codUpfront != null || order.codRemaining != null) && (
          <div style={{ marginTop: 12, background: "#fff8ec", border: "1px solid #f2d9a8", borderRadius: 6, padding: "8px 12px", fontSize: 12 }}>
            <b>Cash on Delivery</b> — Upfront paid: {inr(order.codUpfront)} · Remaining at delivery: {inr(order.codRemaining)}
          </div>
        )}

        <div style={{ marginTop: 14, fontSize: 12 }}>
          <b>Amount in words:</b> Rupees {amountInWords(grandTotal)} only
        </div>

        <div style={{ marginTop: 22, paddingTop: 12, borderTop: "1px solid #e5e5e5", fontSize: 11, color: "#777", textAlign: "center" }}>
          <div>This is a computer generated invoice and does not require a signature.</div>
          <div style={{ marginTop: 4, fontWeight: 700, color: "#2d5016" }}>Thank you for your purchase!</div>
        </div>
      </div>
    </div>
  );
}
