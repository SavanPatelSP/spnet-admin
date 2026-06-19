export function buildCSP(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";
  const directives = [
    "default-src 'self'",
    isDev
      ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`
      : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'unsafe-inline'`,
    "img-src 'self' blob: data: https:",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    !isDev && "upgrade-insecure-requests",
  ]
    .filter(Boolean)
    .map((d) => (typeof d === "string" ? d : ""))
    .filter(Boolean);
  return directives.join("; ").replace(/\s{2,}/g, " ").trim();
}

export function getSecurityHeaders(isDev: boolean): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy":
      "camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()",
    "X-DNS-Prefetch-Control": "off",
    "X-XSS-Protection": "0",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Cache-Control": "no-store, max-age=0",
    "Pragma": "no-cache",
  };
  if (!isDev) {
    headers["Strict-Transport-Security"] =
      "max-age=63072000; includeSubDomains; preload";
  }
  return headers;
}
