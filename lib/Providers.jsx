"use client";

import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/lib/CartContext";
import { AuthProvider } from "@/lib/AuthContext";
import { WishlistProvider } from "@/lib/WishlistContext";
import GoogleSessionBridge from "@/lib/GoogleSessionBridge";

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            <GoogleSessionBridge />
            {children}
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </SessionProvider>
  );
}
