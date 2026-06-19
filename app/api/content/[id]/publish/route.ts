import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { contentStore } from "@/lib/content-store";
import { logAudit } from "@/lib/audit";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiPermission("View Content");
    const { id } = await params;

    const item = await contentStore.transition(id, "PUBLISHED");
    if (!item) {
      return Response.json({ success: false, error: "Cannot publish in current state" }, { status: 400 });
    }

    await logAudit(
      "CONTENT_PUBLISHED",
      null, null, session.user.role, session.user.name,
      `Content "${item.title}" published`,
      session.user.email,
    );

    return Response.json({ success: true, data: item });
  } catch (e) {
    return handleApiError(e);
  }
}
