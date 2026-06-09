import GoogleProvider from "next-auth/providers/google";
import { dbConnect } from "@/lib/server/mongoose";
import { User } from "@/lib/server/models";
import { signJwt } from "@/lib/server/jwt";

// The admin email (from .env ADMIN_EMAIL) is granted superadmin on Google login,
// so the admin panel stays reachable. Falls back to the owner address.
const OWNER_EMAIL = process.env.ADMIN_EMAIL || "ujain528@gmail.com";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  callbacks: {
    // Upsert the Google user into MongoDB on every sign-in.
    async signIn({ user }) {
      await dbConnect();
      const role = user.email === OWNER_EMAIL ? "superadmin" : "customer";
      let dbUser = await User.findOne({ email: user.email });
      if (!dbUser) {
        await User.create({ email: user.email, name: user.name, image: user.image, provider: "google", role });
      } else {
        dbUser.name = user.name;
        dbUser.image = user.image;
        if (user.email === OWNER_EMAIL) dbUser.role = "superadmin"; // never downgrade owner
        await dbUser.save();
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        await dbConnect();
        const dbUser = await User.findOne({ email: user.email }).lean();
        if (dbUser) {
          token.uid = String(dbUser._id);
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid;
        session.user.role = token.role;
      }
      // Bridge to the storefront's Bearer-JWT API: mint an app token the existing
      // /api routes verify with JWT_SECRET, so Google login powers the same flows
      // as phone OTP without forking auth.
      session.appToken = signJwt({
        sub: token.uid,
        name: session.user?.name,
        email: session.user?.email,
        role: token.role,
      });
      return session;
    },
  },
  pages: { signIn: "/login" },
};
