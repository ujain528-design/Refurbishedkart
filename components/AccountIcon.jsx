"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { UserIcon } from "@/components/Icons";

/* Account icon → /account when logged in, else /login.
   When logged in, hover reveals a small dropdown (FIX 2). */
export default function AccountIcon() {
  const { isLoggedIn, user, logout } = useAuth();
  const router = useRouter();

  if (!isLoggedIn) {
    return (
      <Link
        href="/login"
        aria-label="Account"
        className="relative rounded-full p-2.5 text-neutral-600 transition-colors hover:bg-brand-softer hover:text-brand"
      >
        <UserIcon style={{ width: 21, height: 21 }} />
      </Link>
    );
  }

  const firstName = (user?.name || "there").split(" ")[0];
  // logout() clears the app JWT + NextAuth session and redirects to /login itself.
  const doLogout = () => { logout(); };

  return (
    <div className="group relative">
      <Link
        href="/account"
        aria-label="Account"
        className="relative block rounded-full p-2.5 text-neutral-600 transition-colors hover:bg-brand-softer hover:text-brand"
      >
        <UserIcon style={{ width: 21, height: 21 }} />
      </Link>
      {/* hover dropdown */}
      <div className="invisible absolute right-0 top-full z-[60] w-48 translate-y-1 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
        <div className="relative rounded-card border border-black/5 bg-white p-2 shadow-card-hover">
          <span className="absolute -top-1.5 right-4 h-3 w-3 rotate-45 border-l border-t border-black/5 bg-white" />
          <p className="px-3 py-2 text-sm font-bold text-ink">Hi {firstName}</p>
          <Link href="/account" className="block rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-brand-softer hover:text-brand">My Account</Link>
          <button onClick={doLogout} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">Logout</button>
        </div>
      </div>
    </div>
  );
}
