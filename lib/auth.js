"use client";

const KEY = "rk_token";

export function getToken() {
  try { return localStorage.getItem(KEY); } catch { return null; }
}
export function setToken(token) {
  try { localStorage.setItem(KEY, token); } catch {}
}
export function removeToken() {
  try { localStorage.removeItem(KEY); } catch {}
}

/* Decode the JWT payload (no verification — that's the server's job). */
export function getUser() {
  const t = getToken();
  if (!t) return null;
  try {
    const payload = JSON.parse(atob(t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload;
  } catch { return null; }
}

export function isLoggedIn() {
  const u = getUser();
  if (!u) return false;
  if (u.exp && u.exp < Math.floor(Date.now() / 1000)) { removeToken(); return false; }
  return true;
}
