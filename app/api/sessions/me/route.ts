import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireApiAuth();
    const recordId = session.user.sessionRecordId;
    if (!recordId) {
      return Response.json({ success: false, error: "No server session record" }, { status: 401 });
    }

    // Pre-check from JWT to avoid DB query if not expired
    if (session.user.sessionExpiresAt) {
      const jwtExpiry = new Date(session.user.sessionExpiresAt);
      if (jwtExpiry > new Date()) {
        return Response.json({
          success: true,
          session: {
            id: recordId,
            createdAt: session.user.sessionCreatedAt,
            expiresAt: session.user.sessionExpiresAt,
          },
        });
      }
    }

    const record = await prisma.session.findUnique({
      where: { id: recordId },
      select: { id: true, createdAt: true, expiresAt: true },
    });

    if (!record || record.expiresAt < new Date()) {
      if (record) {
        await prisma.session.delete({ where: { id: recordId } }).catch(() => {});
      }
      return Response.json({ success: false, error: "Session expired" }, { status: 401 });
    }

    return Response.json({
      success: true,
      session: {
        id: record.id,
        createdAt: record.createdAt.toISOString(),
        expiresAt: record.expiresAt.toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
