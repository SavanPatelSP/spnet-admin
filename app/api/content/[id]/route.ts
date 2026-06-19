import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { contentStore } from "@/lib/content-store";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiPermission("View Content");
    const { id } = await params;
    const item = await contentStore.get(id);
    if (!item) {
      return Response.json({ success: false, error: "Content not found" }, { status: 404 });
    }
    return Response.json({ success: true, data: item });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiPermission("View Content");
    const { id } = await params;
    const { title, body, category } = await req.json();

    const existing = await contentStore.get(id);
    if (!existing) {
      return Response.json({ success: false, error: "Content not found" }, { status: 404 });
    }

    const updated = await contentStore.update(id, { title, body, category });
    if (!updated) {
      return Response.json({ success: false, error: "Failed to update" }, { status: 500 });
    }

    return Response.json({ success: true, data: updated });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiPermission("Delete Content");
    const { id } = await params;
    const deleted = await contentStore.delete(id);
    if (!deleted) {
      return Response.json({ success: false, error: "Content not found" }, { status: 404 });
    }
    return Response.json({ success: true });
  } catch (e) {
    return handleApiError(e);
  }
}
