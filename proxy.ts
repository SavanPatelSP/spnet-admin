import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { buildCSP, getSecurityHeaders } from "@/lib/security/headers";
import { isValidRole } from "@/lib/security/rbac";

const publicRoutes = new Set(["/login", "/unauthorized", "/setup-password"]);
const publicPrefixes = [
  "/api/auth",
  "/_next",
  "/favicon",
  "/invite",
  "/api/team-members/verify-invite",
  "/api/team-members/setup-password",
];

function pathnameFrom(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

export const proxy = auth((req) => {
  const isDev = process.env.NODE_ENV === "development";
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const cspHeader = buildCSP(nonce);
  const pathname = pathnameFrom(req.url);

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("Content-Security-Policy", cspHeader);
  requestHeaders.set("x-nonce", nonce);

  function addSecurityHeaders(response: NextResponse): NextResponse {
    response.headers.set("Content-Security-Policy", cspHeader);
    for (const [key, value] of Object.entries(getSecurityHeaders(isDev))) {
      response.headers.set(key, value);
    }
    response.headers.set("x-nonce", nonce);
    return response;
  }

  if (
    publicRoutes.has(pathname) ||
    publicPrefixes.some((p) => pathname.startsWith(p))
  ) {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    return addSecurityHeaders(response);
  }

  const isAuthenticated = !!req.auth?.user?.id;
  if (!isAuthenticated) {
    if (pathname.startsWith("/api/")) {
      const response = NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
      return addSecurityHeaders(response);
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    const response = NextResponse.redirect(loginUrl);
    return addSecurityHeaders(response);
  }

  const userRole = req.auth?.user?.role;
  const licenseStatus = req.auth?.user?.licenseStatus;

  if (!licenseStatus || licenseStatus !== "ACTIVE") {
    if (pathname.startsWith("/api/")) {
      const response = NextResponse.json(
        { success: false, error: "License is not active" },
        { status: 403 }
      );
      return addSecurityHeaders(response);
    }
    const signoutUrl = new URL("/api/auth/signout", req.url);
    signoutUrl.searchParams.set("callbackUrl", "/login");
    const response = NextResponse.redirect(signoutUrl);
    return addSecurityHeaders(response);
  }

  if (pathname.startsWith("/admin") || pathname === "/dashboard" || pathname.startsWith("/dashboard/")
    || pathname.startsWith("/api/") || pathname.startsWith("/security")
    || pathname.startsWith("/analytics") || pathname.startsWith("/reports")) {

    if (!userRole || !isValidRole(userRole)) {
      if (pathname.startsWith("/api/")) {
        const response = NextResponse.json(
          { success: false, error: "Invalid role" },
          { status: 403 }
        );
        return addSecurityHeaders(response);
      }
      const response = NextResponse.redirect(new URL("/unauthorized", req.url));
      return addSecurityHeaders(response);
    }
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  return addSecurityHeaders(response);
});

export const config = {
  matcher: [
    {
      source: "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
