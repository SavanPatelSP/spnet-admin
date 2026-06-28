interface IpRecord {
  attempts: number;
  firstAttempt: number;
  blockedUntil: number;
  strikeCount: number;
}

const IP_ATTEMPT_WINDOW = 60_000;
const IP_MAX_ATTEMPTS = 10;
const LOCKOUT_STAGES = [15, 60, 360, 1440];

const ipAttempts = new Map<string, IpRecord>();

function computeLockoutDuration(strikeCount: number): number {
  return LOCKOUT_STAGES[Math.min(strikeCount, LOCKOUT_STAGES.length - 1)] * 60 * 1000;
}

export function checkIpRateLimit(ip: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const record = ipAttempts.get(ip);

  if (record && record.blockedUntil > now) {
    return { allowed: false, retryAfter: Math.ceil((record.blockedUntil - now) / 1000) };
  }

  if (record && record.firstAttempt < now - IP_ATTEMPT_WINDOW) {
    ipAttempts.set(ip, { attempts: 1, firstAttempt: now, blockedUntil: 0, strikeCount: record.strikeCount });
    return { allowed: true, retryAfter: 0 };
  }

  if (record && record.attempts >= IP_MAX_ATTEMPTS) {
    const blockDuration = [60_000, 300_000, 600_000, 3_600_000][Math.min(record.strikeCount, 3)];
    record.blockedUntil = now + blockDuration;
    record.attempts = 0;
    record.strikeCount += 1;
    return { allowed: false, retryAfter: Math.ceil(blockDuration / 1000) };
  }

  if (record) {
    record.attempts += 1;
  } else {
    ipAttempts.set(ip, { attempts: 1, firstAttempt: now, blockedUntil: 0, strikeCount: 0 });
  }

  return { allowed: true, retryAfter: 0 };
}

export { computeLockoutDuration };
