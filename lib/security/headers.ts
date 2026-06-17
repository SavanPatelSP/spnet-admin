export function buildCSP(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";
  if (isDev) {
    return [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`,
      `style-src 'self' 'nonce-${nonce}'`,
      "img-src 'self' blob: data: https:",
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ]
      .join("; ")
      .replace(/\s{2,}/g, " ")
      .trim();
  }
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https:",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ]
    .join("; ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()",
  "X-DNS-Prefetch-Control": "off",
  "X-XSS-Protection": "0",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};
