const IST_TIMEZONE = "Asia/Kolkata";

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function pad(n: number): string {
  return n < 10 ? "0" + n : String(n);
}

function getISTParts(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIMEZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const get = (type: string) => parseInt(parts.find((p) => p.type === type)?.value || "0", 10);
  return {
    year: get("year"),
    month: MONTHS_SHORT[get("month") - 1],
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
  };
}

export function formatDateTime(date: Date | string | number): string {
  const d = new Date(date);
  const { day, month, year, hour, minute } = getISTParts(d);
  const hour12 = hour % 12 || 12;
  const ampm = hour < 12 ? "am" : "pm";
  return `${day} ${month} ${year}, ${hour12}:${pad(minute)} ${ampm}`;
}

export function formatDate(
  date: Date | string | number,
  options?: { month?: string; day?: string; year?: string; hour?: string; minute?: string; weekday?: string }
): string {
  const d = new Date(date);
  const { day, month, year, hour, minute } = getISTParts(d);
  const day2 = pad(day);
  const opts = options || { day: "2-digit", month: "short", year: "numeric" };

  if (opts.weekday === "long") {
    const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const formatter = new Intl.DateTimeFormat("en-IN", { timeZone: IST_TIMEZONE, weekday: "long" });
    return formatter.format(d);
  }

  if (opts.hour && opts.minute) {
    const hour12 = hour % 12 || 12;
    const ampm = hour < 12 ? "am" : "pm";
    return `${day} ${month} ${year}, ${hour12}:${pad(minute)} ${ampm}`;
  }

  return `${day2} ${month} ${year}`;
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

export function formatTimeAgo(date: Date | string | number): string {
  const d = new Date(date).getTime();
  const now = Date.now();
  const seconds = Math.floor((now - d) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDateTime(date);
}
