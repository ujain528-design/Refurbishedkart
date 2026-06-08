"use client";

/* Real JWT auth backed by the API. Token in localStorage; user decoded from it. */

import { createContext, useContext, useEffect, useState } from "react";
import { getToken, setToken, removeToken, getUser, isLoggedIn as tokenValid } from "@/lib/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (tokenValid()) setUser(getUser());
    setReady(true);
  }, []);

  const login = (token) => {
    setToken(token);
    setUser(getUser());
    return getUser();
  };
  const logout = () => {
    removeToken();
    setUser(null);
  };

  const role = user?.role;
  return (
    <AuthContext.Provider
      value={{
        ready, user, token: getToken(),
        isLoggedIn: !!user,
        isAdmin: role === "admin" || role === "superadmin",
        isSuperAdmin: role === "superadmin",
        login, logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
