import createMiddleware from "next-intl/middleware";
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { routing } from "@/i18n/routing";

const { auth } = NextAuth(authConfig);
const intlMiddleware = createMiddleware(routing);

export default auth((req) => {
  return intlMiddleware(req);
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
