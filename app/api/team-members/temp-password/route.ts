import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";
import bcrypt from "bcryptjs";
import crypto from "crypto";

function generateTempPassword(): string {
  return crypto.randomBytes(12).toString("hex");
}

export async function POST(req: Request) {
  try {
    const session = await requireApiPermission("Edit Users");
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return Response.json({ success: false, error: "Member ID is required" }, { status: 400 });
    }

    const member = await prisma.teamMember.findUnique({ where: { id }, include: { role: true } });
    if (!member) {
      return Response.json({ success: false, error: "Team member not found" }, { status: 404 });
    }

    console.log("PASSWORD_GENERATE_START", JSON.stringify({ memberId: id, email: member.email, route: "temp-password" }));

    const oldHash = member.password;
    const oldHashMasked = oldHash ? `${oldHash.slice(0, 7)}...${oldHash.slice(-4)}` : "none";

    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 12);
    const newHashMasked = `${hashedPassword.slice(0, 7)}...${hashedPassword.slice(-4)}`;
    console.log("PASSWORD_HASH_CREATED", JSON.stringify({ oldHash: oldHashMasked, newHash: newHashMasked }));

    await prisma.teamMember.update({
      where: { id },
      data: {
        password: hashedPassword,
        isFirstLogin: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    console.log("PASSWORD_DB_UPDATE", JSON.stringify({ status: "update_complete" }));

    // Post-save verification
    const saved = await prisma.teamMember.findUnique({ where: { id }, select: { password: true, updatedAt: true } });
    const savedHashMasked = saved ? `${saved.password.slice(0, 7)}...${saved.password.slice(-4)}` : "none";
    const hashChanged = saved ? saved.password !== oldHash : false;
    const bcryptResult = saved ? await bcrypt.compare(tempPassword, saved.password) : false;
    console.log("PASSWORD_DB_VERIFY", JSON.stringify({ savedHash: savedHashMasked, hashChanged }));
    console.log("PASSWORD_BCRYPT_VERIFY", JSON.stringify({ result: bcryptResult }));

    if (!saved || !bcryptResult) {
      console.log("PASSWORD_GENERATE_FAILURE", JSON.stringify({ reason: "hash_verification_failed", hasSaved: !!saved, bcryptResult }));
      throw new Error("Password hash verification failed after save");
    }

    await logAudit(
      AUDIT_ACTIONS.TEMP_PASSWORD_GENERATED,
      undefined,
      undefined,
      session.user.role,
      session.user.name,
      `Generated temporary password for ${member.name} (${member.email})`,
      session.user.email
    );

    console.log("PASSWORD_AUDIT_CREATED", JSON.stringify({ status: "audit_logged" }));
    console.log("PASSWORD_GENERATE_SUCCESS", JSON.stringify({
      dbRowUpdated: true,
      hashChanged,
      bcryptVerification: bcryptResult,
      auditCreated: true,
    }));

    return Response.json({ success: true, tempPassword });
  } catch (error) {
    return handleApiError(error);
  }
}
