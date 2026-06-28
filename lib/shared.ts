import { randomBytes } from "crypto";
import { LICENSE_KEY_PREFIX, DEFAULT_LOCALE } from "./constants";

export { formatDateTime, formatDate, daysUntil, isExpiringSoon, isExpired } from "./dates";

export function generateKey(): string {
  return `${LICENSE_KEY_PREFIX}-${randomBytes(8).toString("hex").toUpperCase()}`;
}

export function parseExpiryDate(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

export { cn } from "./utils";

export function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE).format(num);
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPrice(amount: number, currency = "$"): string {
  const formatted = amount.toLocaleString(DEFAULT_LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currency}${formatted}`;
}

export function calculateUtilization(used: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((used / total) * 100);
}

export function generateId(): string {
  return randomBytes(12).toString("hex");
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : plural || `${singular}s`;
}

export interface ParsedUA {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceType: string;
}

export function parseUA(ua: string): ParsedUA {
  const os = ua.includes("Windows") ? "Windows"
    : ua.includes("Mac OS") || ua.includes("macOS") ? "macOS"
    : ua.includes("Linux") && !ua.includes("Android") ? "Linux"
    : ua.includes("Android") ? "Android"
    : ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad") ? "iOS"
    : "Unknown";
  const osVersion = ua.match(/(?:Windows NT |Mac OS X |Android )([\d._]+)/)?.[1]?.replace(/_/g, ".") ?? "";
  const browser = ua.includes("Chrome") && !ua.includes("Edg") ? "Chrome"
    : ua.includes("Firefox") ? "Firefox"
    : ua.includes("Safari") && !ua.includes("Chrome") && !ua.includes("Edg") ? "Safari"
    : ua.includes("Edg") ? "Edge"
    : ua.includes("OPR") || ua.includes("Opera") ? "Opera"
    : "Unknown";
  const browserVersion = ua.match(/(?:Chrome|Firefox|Safari|Edge|OPR)\/([\d.]+)/)?.[1] ?? "";
  const deviceType = ua.includes("Mobile") && !ua.includes("iPad") ? "MOBILE"
    : ua.includes("Tablet") || ua.includes("iPad") || ua.includes("Tab") ? "TABLET"
    : "DESKTOP";
  return { browser, browserVersion, os, osVersion, deviceType };
}
