import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";

export async function GET() {
  try {
    const session = await requireApiAuth();
    const memberId = session.user.id;

    const notifications = await prisma.notification.findMany({
      where: { teamMemberId: memberId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { teamMemberId: memberId, read: false },
    });

    return Response.json({ success: true, notifications, unreadCount });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireApiAuth();
    const memberId = session.user.id;
    const body = await req.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      await prisma.notification.updateMany({
        where: { teamMemberId: memberId, read: false },
        data: { read: true },
      });
    } else if (notificationId) {
      await prisma.notification.update({
        where: { id: notificationId, teamMemberId: memberId },
        data: { read: true },
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
