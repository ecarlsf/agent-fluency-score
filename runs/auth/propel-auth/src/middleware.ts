import { NextResponse } from "next/server";
import {
  buildAuthMiddleware,
  AuthHookResponse,
} from "@propelauth/nextjs/server";

const protectedPaths = ["/dashboard", "/settings"];

export const middleware = buildAuthMiddleware({
  async afterAuthHook(req, _res, user) {
    const { pathname } = req.nextUrl;
    const isProtected = protectedPaths.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );

    if (isProtected && !user) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      return AuthHookResponse.reject(NextResponse.redirect(loginUrl));
    }

    return AuthHookResponse.continue();
  },
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
