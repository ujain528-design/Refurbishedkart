"use client";

/* Cart state — localStorage. Each line stores its OWN resolved price/details at
   add-to-cart time (captured from the product's matching config), so the cart
   page never re-derives prices from catalogue data. Subtotal = Σ price × qty.
   All prices are GST-INCLUSIVE; no tax is added anywhere. */

import { createContext, useContext, useEffect, useState } from "react";
import { cartConfigFor } from "@/lib/pdp";
import { applyCoupon as applyCouponApi } from "@/lib/api";

const STORAGE_KEY = "rk_cart_v2"; // v2: rich lines with stored price
const COUPON_KEY = "rk_coupon_v1";
const MAX_QTY = 10;

const CartContext = createContext(null);

const lineKey = (productId, ram, ssd) => `${productId}|${ram ?? "-"}|${ssd ?? "-"}`;

export function CartProvider({ children }) {
  const [lines, setLines] = useState([]);
  const [couponData, setCouponData] = useState(null);
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

  // Lines already carry price/name/etc — just normalise qty/derived fields.
  const items = lines.map((l) => {
    const price = Number(l.price) || 0;
    const sellable = l.sellable ?? MAX_QTY;
    const qty = Math.min(l.qty, Math.max(0, sellable), MAX_QTY);
    return {
      key: lineKey(l.productId, l.ram, l.ssd),
      productId: l.productId, name: l.name, brand: l.brand, category: l.category, image: l.image ?? null,
      ram: l.ram, ssd: l.ssd, ramType: l.ramType ?? null, whatsInBox: l.whatsInBox ?? "",
      unitPrice: price, mrp: l.mrp, sellable,
      outOfStock: price <= 0 || sellable === 0,
      qty: l.qty, lineTotal: price * Math.max(qty, 0),
    };
  });

  const count = items.reduce((a, it) => a + (it.outOfStock ? 0 : it.qty), 0);
  const subtotal = items.reduce((a, it) => a + (it.outOfStock ? 0 : it.lineTotal), 0);
  const coupon = couponData;
  const discount = couponData
    ? couponData.type === "flat" ? Math.min(couponData.value, subtotal) : Math.round(subtotal * (couponData.value / 100))
    : 0;

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

  function orderItems() {
    return items.filter((it) => !it.outOfStock).map((it) => ({ productId: it.productId, ram: it.ram, ssd: it.ssd, qty: it.qty }));
  }

  /* Capture the resolved config price + display fields AT ADD TIME. `product`
     is the live (DB) product with a configs array, so cartConfigFor returns the
     correct unit price for the selected ram/ssd. */
  function addItem(product, ram, ssd) {
    const cfg = cartConfigFor(product, ram, ssd);
    if (!cfg || cfg.sellable === 0) return false;
    const key = lineKey(product.id, cfg.ram, cfg.ssd);
    setLines((prev) => {
      const existing = prev.find((l) => lineKey(l.productId, l.ram, l.ssd) === key);
      if (existing) {
        return prev.map((l) => (lineKey(l.productId, l.ram, l.ssd) === key ? { ...l, qty: Math.min(l.qty + 1, cfg.sellable, MAX_QTY) } : l));
      }
      return [...prev, {
        productId: product.id, name: product.name, brand: product.brand, category: product.category,
        image: (product.image || product.images?.[0]) ?? null, ram: cfg.ram, ssd: cfg.ssd, ramType: cfg.ramType ?? null,
        whatsInBox: product.whatsInBox ?? "", price: cfg.unitPrice, mrp: product.mrp, sellable: cfg.sellable, qty: 1,
      }];
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
      value={{ ready, items, count, subtotal, coupon, discount, addItem, setQty, removeItem, applyCoupon, clearCoupon, clearCart, orderItems, MAX_QTY }}
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
