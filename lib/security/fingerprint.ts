import { prisma } from "@/lib/prisma";
import { parseUA } from "@/lib/shared";
import { lookupGeoWithCache, getCountryName } from "@/lib/geo";
import { createHash } from "crypto";

export interface FingerprintData {
  ipAddress: string;
  userAgent: string;
  teamMemberId: string;
  sessionId: string;
}

export interface FingerprintResult {
  riskScore: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskFactors: string[];
  isNewDevice: boolean;
  isNewBrowser: boolean;
  isNewCountry: boolean;
  isNewRegion: boolean;
  ipChanged: boolean;
  deviceChanged: boolean;
  suspicious: boolean;
}

function generateDeviceId(teamMemberId: string, browser: string, os: string): string {
  const raw = `${teamMemberId}|${browser}|${os}`;
  return createHash("sha256").update(raw).digest("hex").slice(0, 16);
}

async function getPreviousFingerprints(teamMemberId: string) {
  const previous = await prisma.sessionFingerprint.findMany({
    where: { session: { teamMemberId } },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      deviceId: true,
      browser: true,
      country: true,
      region: true,
      ipAddress: true,
    },
  });
  return previous;
}

export async function captureFingerprint(data: FingerprintData): Promise<FingerprintResult> {
  const parsed = parseUA(data.userAgent);
  const geo = lookupGeoWithCache(data.ipAddress);
  const deviceId = generateDeviceId(data.teamMemberId, parsed.browser, parsed.os);
  const previous = await getPreviousFingerprints(data.teamMemberId);

  const riskFactors: string[] = [];
  const isNewDevice = previous.length > 0 && !previous.some(p => p.deviceId === deviceId);
  const isNewBrowser = previous.length > 0 && !previous.some(p => p.browser === parsed.browser);
  const isNewCountry = previous.length > 0 && !previous.some(p => p.country === geo.country);
  const isNewRegion = previous.length > 0 && !previous.some(p => p.region === geo.region);
  const ipChanged = previous.length > 0 && !previous.some(p => p.ipAddress === data.ipAddress);
  const deviceChanged = previous.length > 0 && !previous.some(p => p.deviceId && p.deviceId !== deviceId);

  if (isNewDevice) riskFactors.push("New device detected");
  if (isNewBrowser) riskFactors.push("New browser detected");
  if (isNewCountry) riskFactors.push("Login from new country");
  if (isNewRegion) riskFactors.push("Login from new region");
  if (ipChanged) riskFactors.push("IP address changed");
  if (deviceChanged) riskFactors.push("Device identifier changed");

  let riskScore: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
  const totalRiskFactors = riskFactors.length;
  if (totalRiskFactors >= 4) riskScore = "CRITICAL";
  else if (totalRiskFactors >= 3) riskScore = "HIGH";
  else if (totalRiskFactors >= 2) riskScore = "MEDIUM";

  const suspicious = totalRiskFactors >= 2;

  await prisma.sessionFingerprint.upsert({
    where: { sessionId: data.sessionId },
    create: {
      sessionId: data.sessionId,
      ipAddress: data.ipAddress,
      country: geo.country,
      countryName: getCountryName(geo.country),
      region: geo.region,
      city: geo.city,
      isp: geo.isp,
      browser: parsed.browser,
      browserVersion: parsed.browserVersion,
      os: parsed.os,
      osVersion: parsed.osVersion,
      deviceType: parsed.deviceType,
      deviceId,
      userAgent: data.userAgent,
      firstSeen: new Date(),
      lastSeen: new Date(),
      riskScore,
      riskFactors: JSON.stringify(riskFactors),
      isNewDevice,
      isNewBrowser,
      isNewCountry,
      isNewRegion,
      ipChanged,
      deviceChanged,
      suspicious,
    },
    update: {
      ipAddress: data.ipAddress,
      country: geo.country,
      countryName: getCountryName(geo.country),
      region: geo.region,
      city: geo.city,
      isp: geo.isp,
      browser: parsed.browser,
      browserVersion: parsed.browserVersion,
      os: parsed.os,
      osVersion: parsed.osVersion,
      deviceType: parsed.deviceType,
      deviceId,
      userAgent: data.userAgent,
      lastSeen: new Date(),
      riskScore,
      riskFactors: JSON.stringify(riskFactors),
      isNewDevice,
      isNewBrowser,
      isNewCountry,
      isNewRegion,
      ipChanged,
      deviceChanged,
      suspicious,
    },
  });

  return {
    riskScore,
    riskFactors,
    isNewDevice,
    isNewBrowser,
    isNewCountry,
    isNewRegion,
    ipChanged,
    deviceChanged,
    suspicious,
  };
}

export async function getSessionFingerprint(sessionId: string) {
  return prisma.sessionFingerprint.findUnique({ where: { sessionId } });
}

export async function getSessionFingerprintHistory(teamMemberId: string, limit = 20) {
  return prisma.sessionFingerprint.findMany({
    where: { session: { teamMemberId } },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      session: {
        select: { expiresAt: true, createdAt: true },
      },
    },
  });
}

export async function getAggregatedFingerprintStats() {
  const [total, suspicious, riskCounts, countryDistinct] = await Promise.all([
    prisma.sessionFingerprint.count(),
    prisma.sessionFingerprint.count({ where: { suspicious: true } }),
    Promise.all(
      ["LOW", "MEDIUM", "HIGH", "CRITICAL"].map(score =>
        prisma.sessionFingerprint.count({ where: { riskScore: score } })
      )
    ),
    prisma.sessionFingerprint.groupBy({ by: ["country"], _count: true }),
  ]);
  return {
    total,
    suspicious,
    riskDistribution: {
      low: riskCounts[0],
      medium: riskCounts[1],
      high: riskCounts[2],
      critical: riskCounts[3],
    },
    countries: countryDistinct,
  };
}
