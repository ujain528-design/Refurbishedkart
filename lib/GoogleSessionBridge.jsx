"use client";

// When NextAuth reports a Google session, mint nothing new — the session already
// carries an app JWT (signed server-side with JWT_SECRET). Hand it to the existing
// localStorage/Bearer auth so Google login powers the same API flows as phone OTP.
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useAuth } from "@/lib/AuthContext";
import { getToken } from "@/lib/auth";

export default function GoogleSessionBridge() {
  const { data: session, status } = useSession();
  const { login } = useAuth();

  useEffect(() => {
    if (status === "authenticated" && session?.appToken && !getToken()) {
      login(session.appToken);
    }
  }, [status, session, login]);

  return null;
}
