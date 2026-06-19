import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { contentStore } from "@/lib/content-store";
import { logAudit } from "@/lib/audit";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiPermission("View Content");
    const { id } = await params;

    const item = await contentStore.transition(id, "DRAFT");
    if (!item) {
      return Response.json({ success: false, error: "Cannot revert to draft in current state" }, { status: 400 });
    }

    await logAudit(
      "CONTENT_REVERTED_TO_DRAFT",
      null, null, session.user.role, session.user.name,
      `Content "${item.title}" reverted to draft`,
      session.user.email,
    );

    return Response.json({ success: true, data: item });
  } catch (e) {
    return handleApiError(e);
  }
}
