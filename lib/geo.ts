interface GeoResult {
  country: string | null;
  region: string | null;
  city: string | null;
  isp: string | null;
}

const IP_RANGES: { range: [number, number]; country: string; region: string | null; city: string | null; isp: string | null }[] = [
  { range: [0x01000000, 0x0100FFFF], country: "US", region: "California", city: "Los Angeles", isp: "Comcast" },
  { range: [0x0A000000, 0x0AFFFFFF], country: "Private", region: null, city: null, isp: null },
  { range: [0xAC100000, 0xAC1FFFFF], country: "Private", region: null, city: null, isp: null },
  { range: [0xC0A80000, 0xC0A8FFFF], country: "Private", region: null, city: null, isp: null },
  { range: [0x4A7D0000, 0x4A7DFFFF], country: "US", region: "Virginia", city: "Ashburn", isp: "Amazon AWS" },
  { range: [0x8E000000, 0x8E00FFFF], country: "US", region: "California", city: "Mountain View", isp: "Google" },
  { range: [0x5F5F0000, 0x5F5FFFFF], country: "US", region: "Washington", city: "Seattle", isp: "Microsoft" },
  { range: [0x0A3E0000, 0x0A3EFFFF], country: "GB", region: "London", city: "London", isp: "BT" },
  { range: [0x4D4F0000, 0x4D4FFFFF], country: "DE", region: "Berlin", city: "Berlin", isp: "Deutsche Telekom" },
  { range: [0x5F200000, 0x5F20FFFF], country: "JP", region: "Tokyo", city: "Tokyo", isp: "NTT" },
  { range: [0x361F0000, 0x361FFFFF], country: "CN", region: "Beijing", city: "Beijing", isp: "China Telecom" },
  { range: [0x4E4F0000, 0x4E4FFFFF], country: "IN", region: "Maharashtra", city: "Mumbai", isp: "Tata" },
  { range: [0x5C5F0000, 0x5C5FFFFF], country: "AU", region: "NSW", city: "Sydney", isp: "Telstra" },
  { range: [0x4F4F0000, 0x4F4FFFFF], country: "BR", region: "São Paulo", city: "São Paulo", isp: "Vivo" },
  { range: [0x5E5E0000, 0x5E5EFFFF], country: "CA", region: "Ontario", city: "Toronto", isp: "Rogers" },
  { range: [0x5A5A0000, 0x5A5AFFFF], country: "FR", region: "Paris", city: "Paris", isp: "Orange" },
];

export function ipToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

export function lookupGeo(ip: string): GeoResult {
  const ipInt = ipToInt(ip);
  const match = IP_RANGES.find(({ range: [start, end] }) => ipInt >= start && ipInt <= end);
  return match
    ? { country: match.country, region: match.region ?? null, city: match.city ?? null, isp: match.isp ?? null }
    : { country: null, region: null, city: null, isp: null };
}

const GEO_CACHE_TTL = 86_400_000;

const geoCache = new Map<string, { result: GeoResult; expiresAt: number }>();

export function lookupGeoWithCache(ip: string): GeoResult {
  const cached = geoCache.get(ip);
  if (cached && cached.expiresAt > Date.now()) return cached.result;
  const result = lookupGeo(ip);
  geoCache.set(ip, { result, expiresAt: Date.now() + GEO_CACHE_TTL });
  return result;
}

interface IpApiResponse {
  status: "success" | "fail";
  country?: string;
  regionName?: string;
  city?: string;
  isp?: string;
  countryCode?: string;
}

export async function resolveGeoFromApi(ip: string): Promise<GeoResult> {
  const cached = geoCache.get(ip);
  if (cached && cached.expiresAt > Date.now()) return cached.result;

  const staticResult = lookupGeo(ip);
  if (staticResult.country) {
    geoCache.set(ip, { result: staticResult, expiresAt: Date.now() + GEO_CACHE_TTL });
    return staticResult;
  }

  if (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
    const localResult: GeoResult = { country: "Private", region: null, city: null, isp: null };
    geoCache.set(ip, { result: localResult, expiresAt: Date.now() + GEO_CACHE_TTL });
    return localResult;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,isp`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return { country: null, region: null, city: null, isp: null };
    const data: IpApiResponse = await res.json();
    const result: GeoResult = {
      country: data.status === "success" ? (data.countryCode ?? null) : null,
      region: data.status === "success" ? (data.regionName ?? null) : null,
      city: data.status === "success" ? (data.city ?? null) : null,
      isp: data.status === "success" ? (data.isp ?? null) : null,
    };
    geoCache.set(ip, { result, expiresAt: Date.now() + GEO_CACHE_TTL });
    return result;
  } catch {
    return { country: null, region: null, city: null, isp: null };
  }
}

export function getCountryName(code: string | null): string {
  if (!code) return "Unknown";
  const names: Record<string, string> = {
    US: "United States", GB: "United Kingdom", DE: "Germany", FR: "France",
    JP: "Japan", CN: "China", IN: "India", BR: "Brazil", AU: "Australia",
    CA: "Canada", RU: "Russia", KR: "South Korea", SG: "Singapore",
    NL: "Netherlands", SE: "Sweden", NO: "Norway", DK: "Denmark",
    FI: "Finland", IT: "Italy", ES: "Spain", CH: "Switzerland",
    IE: "Ireland", NZ: "New Zealand", HK: "Hong Kong", TW: "Taiwan",
    Private: "Private Network", Unknown: "Unknown",
  };
  return names[code] || code;
}
