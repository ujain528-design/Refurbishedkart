import NextAuth from "next-auth";
import { authOptions } from "@/lib/server/authOptions";

// Explicit routes under /api/auth (otp/*, dev-login) are more specific than this
// catch-all and take precedence; NextAuth handles signin/callback/session/etc.
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
