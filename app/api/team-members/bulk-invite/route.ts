import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";
import bcrypt from "bcryptjs";
import crypto from "crypto";

function generateTempPassword(): string {
  return crypto.randomBytes(12).toString("hex");
}

export async function POST(req: Request) {
  try {
    const session = await requirePermission("Bulk Invite Users");
    const body = await req.json();
    const { invites } = body;

    if (!Array.isArray(invites) || invites.length === 0) {
      return Response.json({ success: false, error: "Invites array is required and must not be empty" }, { status: 400 });
    }

    const results: Array<{ name: string; email: string; success: boolean; tempPassword?: string; error?: string }> = [];

    for (const invite of invites) {
      const { name, email, roleId } = invite;

      if (!name || !email || !roleId) {
        results.push({ name, email, success: false, error: "Name, email, and role are required" });
        continue;
      }

      const existing = await prisma.teamMember.findUnique({ where: { email } });
      if (existing) {
        results.push({ name, email, success: false, error: "A member with this email already exists" });
        continue;
      }

      const tempPassword = generateTempPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, 12);

      await prisma.teamMember.create({
        data: { name, email, roleId, password: hashedPassword },
      });

      results.push({ name, email, success: true, tempPassword });
    }

    const successful = results.filter((r) => r.success);

    if (successful.length > 0) {
      await logAudit(
        AUDIT_ACTIONS.BULK_INVITE_SENT,
        undefined,
        undefined,
        session.user.role,
        session.user.name,
        `Bulk invited ${successful.length} team member(s)`
      );
    }

    return Response.json({ success: true, data: results });
  } catch (error) {
    console.error("Bulk invite error:", error);
    return Response.json({ success: false, error: "Failed to process bulk invite" }, { status: 500 });
  }
}
