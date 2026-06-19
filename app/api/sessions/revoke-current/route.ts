import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const session = await requireApiAuth();
    const recordId = session.user.sessionRecordId;
    if (recordId) {
      await prisma.session.delete({ where: { id: recordId } }).catch(() => {});
    }
    return Response.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
