import type { Metadata } from "next";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Notifications" };

import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

export default async function NotificationsPage() {
  const session = await requireAuth();
  const memberId = session.user.id;

  const [unreadCount, totalCount] = await Promise.all([
    prisma.notification.count({ where: { teamMemberId: memberId, read: false, archived: false } }),
    prisma.notification.count({ where: { teamMemberId: memberId, archived: false } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="View and manage your notifications."
      />
      <NotificationCenter memberId={memberId} initialUnread={unreadCount} initialTotal={totalCount} />
    </div>
  );
}
