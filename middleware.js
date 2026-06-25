import { NextResponse } from "next/server";

// Edge middleware: a UX gate that redirects un-authenticated visitors away from
// /admin pages to /admin/login. It does a DECODE-ONLY expiry check (no signature
// verification — node:crypto isn't available in the edge runtime). The real
// security boundary is requireAdmin() on every /api/admin route, which fully
// verifies the JWT signature in the Node runtime. A forged cookie can at most
// render the empty admin shell; all data access still fails server-side.

const ADMIN_COOKIE = "rk_admin";

function tokenExp(token) {
  try {
    const part = token.split(".")[1];
    if (!part) return 0;
    let b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    b64 += "=".repeat((4 - (b64.length % 4)) % 4);
    const payload = JSON.parse(atob(b64));
    return Number(payload.exp) || 0;
  } catch {
    return 0;
  }
}

export function middleware(req) {
  const { pathname } = req.nextUrl;

  // The login page itself must stay reachable.
  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
    return NextResponse.next();
  }

  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  const valid = token ? tokenExp(token) > Math.floor(Date.now() / 1000) : false;
  if (!valid) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

// Only guard admin PAGES. /api/admin/* routes are guarded by requireAdmin().
export const config = { matcher: ["/admin/:path*"] };
