"use client";

/* Wishlist — localStorage-backed, stores product ids. Repriced against
   ALL_PRODUCTS on read so the account grid always shows live data. */

import { createContext, useContext, useEffect, useState } from "react";
import { ALL_PRODUCTS } from "@/lib/data";

const KEY = "rk_wishlist_v1";
const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [ids, setIds] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (Array.isArray(raw)) setIds(raw);
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(ids));
  }, [ids, ready]);

  const has = (id) => ids.includes(id);
  const toggle = (id) => setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const remove = (id) => setIds((prev) => prev.filter((x) => x !== id));

  /* On login, merge the guest (localStorage) wishlist with the server-side
     wishlist, de-duplicated. No backend yet, so this is a no-op: the guest
     list already lives in localStorage and is never cleared on login, so it
     survives the transition. When the backend lands, fetch server ids here
     and setIds([...new Set([...ids, ...serverIds])]). */
  const mergeOnLogin = (serverIds = []) =>
    setIds((prev) => [...new Set([...prev, ...serverIds])]);

  const items = ids.map((id) => ALL_PRODUCTS.find((p) => p.id === id)).filter(Boolean);

  return (
    <WishlistContext.Provider value={{ ready, ids, items, count: ids.length, has, toggle, remove, mergeOnLogin }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
