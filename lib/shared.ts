import { randomBytes } from "crypto";
import { LICENSE_KEY_PREFIX, DEFAULT_LOCALE } from "./constants";

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function generateKey(): string {
  return `${LICENSE_KEY_PREFIX}-${randomBytes(8).toString("hex").toUpperCase()}`;
}

export function parseExpiryDate(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

function pad(n: number): string {
  return n < 10 ? "0" + n : String(n);
}

function formatDateTimeParts(date: Date) {
  return {
    day: date.getDate(),
    month: MONTHS_SHORT[date.getMonth()],
    year: date.getFullYear(),
    hour: date.getHours(),
    minute: date.getMinutes(),
  };
}

export function formatDate(
  date: Date | string | number,
  options?: { month?: string; day?: string; year?: string; hour?: string; minute?: string; weekday?: string }
): string {
  const d = new Date(date);
  const { day, month, year, hour, minute } = formatDateTimeParts(d);
  const day2 = pad(day);
  const opts = options || { day: "2-digit", month: "short", year: "numeric" };

  if (opts.weekday === "long") {
    const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return DAYS[d.getDay()];
  }

  if (opts.hour && opts.minute) {
    const hour12 = hour % 12 || 12;
    const ampm = hour < 12 ? "am" : "pm";
    return `${day} ${month} ${year}, ${hour12}:${pad(minute)} ${ampm}`;
  }

  return `${day2} ${month} ${year}`;
}

export function formatDateTime(date: Date | string | number): string {
  const d = new Date(date);
  const { day, month, year, hour, minute } = formatDateTimeParts(d);
  const hour12 = hour % 12 || 12;
  const ampm = hour < 12 ? "am" : "pm";
  return `${day} ${month} ${year}, ${hour12}:${pad(minute)} ${ampm}`;
}

export function daysUntil(date: Date | string | number): number {
  const target = new Date(date).getTime();
  const now = Date.now();
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

export function isExpiringSoon(date: Date | string | number, thresholdDays = 30): boolean {
  const days = daysUntil(date);
  return days >= 0 && days <= thresholdDays;
}

export function isExpired(date: Date | string | number): boolean {
  return new Date(date).getTime() <= Date.now();
}

export function cn(...inputs: (string | boolean | undefined | null)[]): string {
  return inputs.filter(Boolean).join(" ");
}

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
