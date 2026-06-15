import { randomBytes } from "crypto";
import { LICENSE_KEY_PREFIX, DEFAULT_LOCALE } from "./constants";

export function generateKey(): string {
  return `${LICENSE_KEY_PREFIX}-${randomBytes(8).toString("hex").toUpperCase()}`;
}

export function parseExpiryDate(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  },
  locale = DEFAULT_LOCALE
): string {
  return new Intl.DateTimeFormat(locale, options).format(new Date(date));
}

export function formatDateTime(
  date: Date | string | number,
  locale = DEFAULT_LOCALE
): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
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
