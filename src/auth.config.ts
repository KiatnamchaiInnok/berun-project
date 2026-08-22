import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;
      const isPublic =
        pathname.includes("/login") ||
        pathname.includes("/api/auth") ||
        pathname.startsWith("/_next");
      if (isPublic) return true;
      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
