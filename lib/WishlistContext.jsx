"use client";

/* Wishlist. Guests use localStorage (unchanged). On login the guest list is
   merged into the server wishlist; while logged in, every change hits the API.
   Product metadata for the grid is hydrated from the catalogue (= DB seed). */

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { ALL_PRODUCTS } from "@/lib/data";
import { useAuth } from "@/lib/AuthContext";
import { mergeWishlist, addToWishlist, removeFromWishlist } from "@/lib/api";

const KEY = "rk_wishlist_v1";
const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { isLoggedIn } = useAuth();
  const [ids, setIds] = useState([]);
  const [ready, setReady] = useState(false);
  const wasLoggedIn = useRef(false);

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

  // On login: merge guest list into the server wishlist, then adopt the result.
  useEffect(() => {
    if (!ready) return;
    if (isLoggedIn && !wasLoggedIn.current) {
      mergeWishlist(ids).then((serverIds) => setIds(serverIds)).catch(() => {});
    }
    wasLoggedIn.current = isLoggedIn;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, ready]);

  const has = (id) => ids.includes(Number(id));

  const toggle = (id) => {
    const n = Number(id);
    const adding = !ids.includes(n);
    // optimistic local update
    setIds((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));
    if (isLoggedIn) {
      const call = adding ? addToWishlist(n) : removeFromWishlist(n);
      call.then((serverIds) => setIds(serverIds)).catch(() => {});
    }
  };

  const remove = (id) => {
    const n = Number(id);
    setIds((prev) => prev.filter((x) => x !== n));
    if (isLoggedIn) removeFromWishlist(n).then((serverIds) => setIds(serverIds)).catch(() => {});
  };

  const mergeOnLogin = (serverIds = []) => setIds((prev) => [...new Set([...prev, ...serverIds.map(Number)])]);

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
