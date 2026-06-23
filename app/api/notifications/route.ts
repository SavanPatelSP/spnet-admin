import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { markStart, markEnd } from "@/lib/perf";

export async function GET() {
  try {
    const session = await requireApiAuth();
    const memberId = session.user.id;

    markStart("NOTIFICATIONS_QUERY");
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { teamMemberId: memberId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.notification.count({
        where: { teamMemberId: memberId, read: false },
      }),
    ]);
    markEnd("NOTIFICATIONS_QUERY", notifications.length + unreadCount);

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
