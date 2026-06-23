import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS, AUTH_URL, PLAN_PRICES, LICENSE_TIERS } from "@/lib/constants";
import { generateKey, parseExpiryDate } from "@/lib/shared";
import { createInvoiceForLicense } from "@/lib/invoices";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const INVITE_TOKEN_EXPIRY_HOURS = 72;

function generateInviteToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function POST(req: Request) {
  try {
    const session = await requireApiPermission("Invite Team Members");
    const body = await req.json();

    const { name, email, roleId, organization, plan, maxDevices, expiresAt, notes, sendInvite, tempPassword } = body;

    if (!name || !email || !roleId || !organization) {
      return Response.json(
        { success: false, error: "Name, email, role and organization are required" },
        { status: 400 }
      );
    }

    if (!tempPassword) {
      return Response.json({ success: false, error: "Password is required" }, { status: 400 });
    }

    const existing = await prisma.teamMember.findUnique({ where: { email } });
    if (existing) {
      return Response.json({ success: false, error: "A member with this email already exists" }, { status: 409 });
    }

    const role = await prisma.role.findUnique({ where: { id: roleId }, select: { id: true, name: true } });
    if (!role) {
      return Response.json({ success: false, error: "Role not found" }, { status: 404 });
    }

    const tier = LICENSE_TIERS.find((t) => t.label === plan) || LICENSE_TIERS[0];
    const expiryDate = expiresAt ? parseExpiryDate(expiresAt) : new Date(Date.now() + tier.durationDays * 24 * 60 * 60 * 1000);

    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // 1. Create license
    const license = await prisma.license.create({
      data: {
        key: generateKey(),
        organization,
        plan: tier.label,
        status: "ACTIVE",
        maxDevices: Number(maxDevices) || tier.maxDevices,
        expiresAt: expiryDate,
        notes: notes || `Created for ${name} via unified onboarding`,
      },
    });

    // 2. Create team member and assign license
    const inviteToken = sendInvite !== false ? generateInviteToken() : null;
    const inviteTokenExpiresAt = inviteToken
      ? new Date(Date.now() + INVITE_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)
      : null;

    const member = await prisma.teamMember.create({
      data: {
        name,
        email,
        roleId,
        password: hashedPassword,
        licenseId: license.id,
        status: sendInvite !== false ? "PENDING" : "ACTIVE",
        inviteToken,
        inviteTokenExpiresAt,
      },
      include: { role: { select: { name: true } }, license: true },
    });

    // 3. Create invoice for license
    try {
      const price = tier.price ?? 0;
      if (price > 0) {
        await createInvoiceForLicense(license.id, tier.label, price, license.id);
      }
    } catch {
      // Invoice generation is best-effort.
    }

    const inviteLink = inviteToken ? `${AUTH_URL}/invite/${inviteToken}` : null;

    await logAudit(
      AUDIT_ACTIONS.TEAM_MEMBER_CREATED,
      license.id,
      organization,
      session.user.role,
      session.user.name,
      `Created team member ${name} (${email}) with ${tier.label} license ${license.key}`,
      session.user.email
    );

    return Response.json({
      success: true,
      data: {
        member,
        license,
        inviteLink,
        tempPassword,
        licensePrice: tier.price,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
