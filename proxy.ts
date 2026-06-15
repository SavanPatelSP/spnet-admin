import { auth } from "@/auth";
import { NextResponse } from "next/server";

const publicRoutes = new Set(["/login", "/unauthorized"]);
const publicPrefixes = ["/api/auth", "/_next", "/favicon"];

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth?.user?.id;

  if (
    publicRoutes.has(pathname) ||
    publicPrefixes.some((p) => pathname.startsWith(p))
  ) {
    return;
  }

  if (!isAuthenticated) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return Response.redirect(loginUrl);
  }

  return;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
