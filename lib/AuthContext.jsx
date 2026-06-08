"use client";

/* Mock auth — localStorage only, no real backend (Session 7).
   Becomes JWT/session when the backend lands. */

import { createContext, useContext, useEffect, useState } from "react";

const KEY = "rk_auth_v1";
const AuthContext = createContext(null);

const MOCK_USER = { name: "Utkarsh Jain", email: "ujain528@gmail.com", phone: "+91 98765 43210", role: "superadmin" };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  const login = (partial = {}) => {
    const u = { ...MOCK_USER, ...partial };
    setUser(u);
    try { localStorage.setItem(KEY, JSON.stringify(u)); } catch {}
    return u;
  };
  const logout = () => {
    setUser(null);
    try { localStorage.removeItem(KEY); } catch {}
  };

  return (
    <AuthContext.Provider value={{ ready, user, isLoggedIn: !!user, isAdmin: user?.role === "admin" || user?.role === "superadmin", isSuperAdmin: user?.role === "superadmin", login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
