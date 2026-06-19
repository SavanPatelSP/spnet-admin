import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { contentStore } from "@/lib/content-store";
import type { WorkflowState } from "@/lib/content";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireApiPermission("View Content");
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || undefined;
    const status = url.searchParams.get("status") as WorkflowState | undefined;
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const pageSize = parseInt(url.searchParams.get("pageSize") || "20", 10);

    const result = await contentStore.list({ search, status, page, pageSize });
    return Response.json({ success: true, ...result });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireApiPermission("View Content");
    const { title, body, category } = await req.json();

    if (!title?.trim() || !body?.trim()) {
      return Response.json({ success: false, error: "Title and body are required" }, { status: 400 });
    }

    const item = await contentStore.create({
      title,
      body,
      category: category || "General",
      author: session.user.name || session.user.email,
      authorEmail: session.user.email,
    });

    await logAudit(
      "CONTENT_CREATED",
      null, null, session.user.role, session.user.name,
      `Content "${title}" created`,
      session.user.email,
    );

    return Response.json({ success: true, data: item });
  } catch (e) {
    return handleApiError(e);
  }
}
