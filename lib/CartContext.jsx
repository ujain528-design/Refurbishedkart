"use client";

/* Cart state — React Context backed by localStorage (Session 5 brief).
   Single source of truth for the whole app. Persists across refresh.
   All prices are GST-INCLUSIVE; no tax is added anywhere. */

import { createContext, useContext, useEffect, useState } from "react";
import { ALL_PRODUCTS } from "@/lib/data";
import { cartConfigFor } from "@/lib/pdp";

const STORAGE_KEY = "rk_cart_v1";
const COUPON_KEY = "rk_coupon_v1";
const MAX_QTY = 10;
const COUPONS = { SAVE10: { value: 10 } }; // pct off — single source for cart + checkout

const CartContext = createContext(null);

const lineKey = (productId, ram, ssd) => `${productId}|${ram ?? "-"}|${ssd ?? "-"}`;

export function CartProvider({ children }) {
  const [lines, setLines] = useState([]);
  const [couponCode, setCouponCode] = useState(null);
  const [ready, setReady] = useState(false);

  // hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      setLines(Array.isArray(saved) ? saved : []);
    } catch {
      setLines([]);
    }
    const c = localStorage.getItem(COUPON_KEY);
    if (c && COUPONS[c]) setCouponCode(c);
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, ready]);

  useEffect(() => {
    if (!ready) return;
    if (couponCode) localStorage.setItem(COUPON_KEY, couponCode);
    else localStorage.removeItem(COUPON_KEY);
  }, [couponCode, ready]);

  /* Build a fresh, repriced view of each line against current product data —
     so a price or stock change is reflected even on a persisted cart. */
  const items = lines
    .map((l) => {
      const product = ALL_PRODUCTS.find((p) => p.id === l.productId);
      if (!product) return null;
      const cfg = cartConfigFor(product, l.ram, l.ssd);
      const qty = Math.min(l.qty, Math.max(0, cfg.sellable), MAX_QTY);
      return {
        key: lineKey(l.productId, l.ram, l.ssd),
        productId: l.productId,
        name: product.name,
        brand: product.brand,
        category: product.category,
        image: product.image ?? null,
        ram: l.ram,
        ssd: l.ssd,
        ramType: cfg.ramType,
        unitPrice: cfg.unitPrice,
        mrp: product.mrp,
        sellable: cfg.sellable,
        outOfStock: cfg.sellable === 0,
        qty: l.qty, // keep requested qty; UI clamps display
        lineTotal: cfg.unitPrice * Math.max(qty, 0),
      };
    })
    .filter(Boolean);

  const count = items.reduce((a, it) => a + (it.outOfStock ? 0 : it.qty), 0);
  const subtotal = items.reduce((a, it) => a + (it.outOfStock ? 0 : it.lineTotal), 0);
  const coupon = couponCode ? { code: couponCode, ...COUPONS[couponCode] } : null;
  const discount = coupon ? Math.round(subtotal * (coupon.value / 100)) : 0;

  function applyCoupon(raw) {
    const code = raw.trim().toUpperCase();
    if (COUPONS[code]) {
      setCouponCode(code);
      return true;
    }
    return false;
  }
  function clearCoupon() {
    setCouponCode(null);
  }

  /* Snapshot for the order-confirmation page, then empty the cart. */
  function checkout() {
    const order = {
      id: "RK-2026-00001",
      placedAt: new Date().toISOString(),
      items: items.filter((it) => !it.outOfStock).map((it) => ({
        name: it.name, brand: it.brand, ram: it.ram, ssd: it.ssd,
        ramType: it.ramType, qty: it.qty, unitPrice: it.unitPrice, image: it.image,
      })),
      subtotal,
      discount,
      coupon: coupon?.code ?? null,
    };
    try {
      sessionStorage.setItem("rk_last_order", JSON.stringify(order));
    } catch {}
    setLines([]);
    setCouponCode(null);
    return order;
  }

  function addItem(product, ram, ssd) {
    const cfg = cartConfigFor(product, ram, ssd);
    if (cfg.sellable === 0) return false;
    const key = lineKey(product.id, cfg.ram, cfg.ssd);
    setLines((prev) => {
      const existing = prev.find((l) => lineKey(l.productId, l.ram, l.ssd) === key);
      if (existing) {
        return prev.map((l) =>
          lineKey(l.productId, l.ram, l.ssd) === key
            ? { ...l, qty: Math.min(l.qty + 1, cfg.sellable, MAX_QTY) }
            : l
        );
      }
      return [...prev, { productId: product.id, ram: cfg.ram, ssd: cfg.ssd, qty: 1 }];
    });
    return true;
  }

  function setQty(key, qty) {
    setLines((prev) =>
      prev
        .map((l) =>
          lineKey(l.productId, l.ram, l.ssd) === key
            ? { ...l, qty: Math.max(1, Math.min(qty, MAX_QTY)) }
            : l
        )
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
        addItem, setQty, removeItem, applyCoupon, clearCoupon, checkout, MAX_QTY,
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
