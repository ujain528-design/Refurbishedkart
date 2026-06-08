"use client";

/* Cart state — React Context backed by localStorage (unchanged per spec).
   Product metadata for line display is hydrated from the catalogue (identical
   to the DB seed); stock + coupon are validated against the API. All prices are
   GST-INCLUSIVE; no tax is added anywhere. */

import { createContext, useContext, useEffect, useState } from "react";
import { ALL_PRODUCTS } from "@/lib/data";
import { cartConfigFor } from "@/lib/pdp";
import { applyCoupon as applyCouponApi } from "@/lib/api";

const STORAGE_KEY = "rk_cart_v1";
const COUPON_KEY = "rk_coupon_v1";
const MAX_QTY = 10;

const CartContext = createContext(null);

const lineKey = (productId, ram, ssd) => `${productId}|${ram ?? "-"}|${ssd ?? "-"}`;

export function CartProvider({ children }) {
  const [lines, setLines] = useState([]);
  const [couponData, setCouponData] = useState(null); // { code, type, value }
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      setLines(Array.isArray(saved) ? saved : []);
    } catch { setLines([]); }
    try {
      const c = JSON.parse(localStorage.getItem(COUPON_KEY) || "null");
      if (c && c.code) setCouponData(c);
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => { if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(lines)); }, [lines, ready]);
  useEffect(() => {
    if (!ready) return;
    if (couponData) localStorage.setItem(COUPON_KEY, JSON.stringify(couponData));
    else localStorage.removeItem(COUPON_KEY);
  }, [couponData, ready]);

  const items = lines
    .map((l) => {
      const product = ALL_PRODUCTS.find((p) => p.id === l.productId);
      if (!product) return null;
      const cfg = cartConfigFor(product, l.ram, l.ssd);
      const qty = Math.min(l.qty, Math.max(0, cfg.sellable), MAX_QTY);
      return {
        key: lineKey(l.productId, l.ram, l.ssd),
        productId: l.productId, name: product.name, brand: product.brand, category: product.category,
        image: product.image ?? null, ram: l.ram, ssd: l.ssd, ramType: cfg.ramType,
        unitPrice: cfg.unitPrice, mrp: product.mrp, sellable: cfg.sellable,
        outOfStock: cfg.sellable === 0, qty: l.qty, lineTotal: cfg.unitPrice * Math.max(qty, 0),
      };
    })
    .filter(Boolean);

  const count = items.reduce((a, it) => a + (it.outOfStock ? 0 : it.qty), 0);
  const subtotal = items.reduce((a, it) => a + (it.outOfStock ? 0 : it.lineTotal), 0);
  const coupon = couponData;
  const discount = couponData
    ? couponData.type === "flat"
      ? Math.min(couponData.value, subtotal)
      : Math.round(subtotal * (couponData.value / 100))
    : 0;

  /* Validate the coupon against the API (real SAVE10 etc.). Async — returns
     { ok } / throws via caller's catch. Percent value is stored so the discount
     stays correct as the cart subtotal changes. */
  async function applyCoupon(raw) {
    const code = String(raw || "").trim().toUpperCase();
    if (!code) return { ok: false, error: "Enter a coupon code" };
    const res = await applyCouponApi(code, subtotal);
    if (!res?.valid) return { ok: false, error: res?.error || "Invalid coupon code" };
    setCouponData({ code: res.code, type: res.type, value: res.value });
    return { ok: true };
  }
  function clearCoupon() { setCouponData(null); }
  function clearCart() { setLines([]); setCouponData(null); }

  /* Items in the shape POST /api/orders expects (server reprices everything). */
  function orderItems() {
    return items.filter((it) => !it.outOfStock).map((it) => ({ productId: it.productId, ram: it.ram, ssd: it.ssd, qty: it.qty }));
  }

  function addItem(product, ram, ssd) {
    const cfg = cartConfigFor(product, ram, ssd);
    if (cfg.sellable === 0) return false;
    const key = lineKey(product.id, cfg.ram, cfg.ssd);
    setLines((prev) => {
      const existing = prev.find((l) => lineKey(l.productId, l.ram, l.ssd) === key);
      if (existing) {
        return prev.map((l) =>
          lineKey(l.productId, l.ram, l.ssd) === key ? { ...l, qty: Math.min(l.qty + 1, cfg.sellable, MAX_QTY) } : l
        );
      }
      return [...prev, { productId: product.id, ram: cfg.ram, ssd: cfg.ssd, qty: 1 }];
    });
    return true;
  }

  function setQty(key, qty) {
    setLines((prev) =>
      prev.map((l) => (lineKey(l.productId, l.ram, l.ssd) === key ? { ...l, qty: Math.max(1, Math.min(qty, MAX_QTY)) } : l))
        .filter((l) => l.qty > 0)
    );
  }

  function removeItem(key) {
    setLines((prev) => prev.filter((l) => lineKey(l.productId, l.ram, l.ssd) !== key));
  }

  return (
    <CartContext.Provider
      value={{
        ready, items, count, subtotal, coupon, discount,
        addItem, setQty, removeItem, applyCoupon, clearCoupon, clearCart, orderItems, MAX_QTY,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
