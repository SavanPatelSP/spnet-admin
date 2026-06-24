import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await requireApiAuth();
    const memberId = session.user.id;
    const { searchParams } = req.nextUrl;
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const pageSize = Math.max(1, Math.min(50, Number(searchParams.get("pageSize") || "20")));
    const category = searchParams.get("category") || undefined;
    const archived = searchParams.get("archived");
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const where: Record<string, unknown> = { teamMemberId: memberId };
    if (category) where.category = category;
    if (archived === "true") where.archived = true;
    else if (archived !== "all") where.archived = false;
    if (unreadOnly) where.read = false;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: where as any,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.notification.count({ where: where as any }),
      prisma.notification.count({
        where: { teamMemberId: memberId, read: false, archived: false },
      }),
    ]);

    return Response.json({ success: true, notifications, unreadCount, total, page, pageSize });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireApiAuth();
    const memberId = session.user.id;
    const body = await req.json();
    const { notificationId, markAll, archive, unarchive } = body;

    if (markAll) {
      await prisma.notification.updateMany({
        where: { teamMemberId: memberId, read: false },
        data: { read: true },
      });
    } else if (notificationId) {
      const updateData: Record<string, unknown> = {};
      if (body.read !== undefined) updateData.read = body.read;
      if (archive) updateData.archived = true;
      if (unarchive) updateData.archived = false;
      await prisma.notification.update({
        where: { id: notificationId, teamMemberId: memberId },
        data: updateData,
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await requireApiAuth();
    const memberId = session.user.id;
    const body = await req.json();
    const { notificationId } = body;

    if (notificationId) {
      await prisma.notification.delete({
        where: { id: notificationId, teamMemberId: memberId },
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
