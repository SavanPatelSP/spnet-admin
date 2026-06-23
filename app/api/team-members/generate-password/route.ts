import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth-helpers";
import { handleApiError, ForbiddenError } from "@/lib/security/errors";
import { checkRateLimit, rateLimitKey, RATE_LIMIT_CONFIGS } from "@/lib/security/rate-limit";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";
import bcrypt from "bcryptjs";
import crypto from "crypto";

interface GenerateRequest {
  memberId: string;
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

function generatePassword(config: { length: number; uppercase: boolean; lowercase: boolean; numbers: boolean; symbols: boolean }): string {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const sym = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  let chars = "";
  if (config.uppercase) chars += upper;
  if (config.lowercase) chars += lower;
  if (config.numbers) chars += digits;
  if (config.symbols) chars += sym;

  if (!chars) chars = upper + lower + digits;

  let password = "";
  if (config.uppercase) password += upper[crypto.randomInt(upper.length)];
  if (config.lowercase) password += lower[crypto.randomInt(lower.length)];
  if (config.numbers) password += digits[crypto.randomInt(digits.length)];
  if (config.symbols) password += sym[crypto.randomInt(sym.length)];

  const all = chars;
  for (let i = password.length; i < config.length; i++) {
    password += all[crypto.randomInt(all.length)];
  }

  return password.split("").sort(() => crypto.randomInt(3) - 1).join("");
}

export async function POST(req: Request) {
  try {
    const session = await requireApiAuth();
    if (session.user.role !== "OWNER") {
      throw new ForbiddenError("Only the Owner can generate passwords");
    }

    const rl = checkRateLimit(rateLimitKey("sensitive", `generate-password:${session.user.id}`), {
      windowMs: 60_000,
      maxRequests: 5,
    });
    if (!rl.allowed) {
      return Response.json({ success: false, error: "Too many requests. Please wait before generating another password." }, { status: 429 });
    }

    const body: GenerateRequest = await req.json();
    const { memberId, length = 16, uppercase = true, lowercase = true, numbers = true, symbols = true } = body;

    if (!memberId) {
      return Response.json({ success: false, error: "Member ID is required" }, { status: 400 });
    }

    const validLengths = [12, 16, 20, 24];
    if (!validLengths.includes(length)) {
      return Response.json({ success: false, error: "Password length must be 12, 16, 20, or 24" }, { status: 400 });
    }

    if (!uppercase && !lowercase && !numbers && !symbols) {
      return Response.json({ success: false, error: "At least one character type must be selected" }, { status: 400 });
    }

    const member = await prisma.teamMember.findUnique({
      where: { id: memberId },
      include: { role: true },
    });
    if (!member) {
      return Response.json({ success: false, error: "Team member not found" }, { status: 404 });
    }

    const generatedPassword = generatePassword({ length, uppercase, lowercase, numbers, symbols });
    const hashedPassword = await bcrypt.hash(generatedPassword, 12);

    await prisma.teamMember.update({
      where: { id: memberId },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date(),
        isFirstLogin: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    prisma.notification.create({
      data: {
        teamMemberId: memberId,
        title: "Credentials Updated",
        message: "Your account password has been updated by the system owner.\nPlease use the new credentials provided to you.",
        type: "INFO",
        read: false,
      },
    }).catch(() => {});

    const saved = await prisma.teamMember.findUnique({ where: { id: memberId }, select: { password: true, updatedAt: true } });
    const bcryptResult = saved ? await bcrypt.compare(generatedPassword, saved.password) : false;

    if (!saved || !bcryptResult) {
      throw new Error("Password hash verification failed after save");
    }

    await logAudit(
      AUDIT_ACTIONS.GENERATED_TEAM_MEMBER_PASSWORD,
      undefined,
      undefined,
      session.user.role,
      session.user.name,
      `Generated password for team member ${member.name} (${member.email})`,
      session.user.email,
      "High",
      "team_member",
      memberId,
      {
        generatedBy: session.user.id,
        generatedByEmail: session.user.email,
        targetMemberId: memberId,
        targetMemberEmail: member.email,
        timestamp: new Date().toISOString(),
        action: "GENERATED_TEAM_MEMBER_PASSWORD",
        passwordLength: length,
      }
    );

    return Response.json({
      success: true,
      password: generatedPassword,
      member: {
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role.name,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
