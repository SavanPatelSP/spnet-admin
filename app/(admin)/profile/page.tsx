import type { Metadata } from "next";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Profile Center" };

import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { ProfileCenter } from "@/components/profile/ProfileCenter";

export default async function ProfilePage() {
  const session = await requireAuth();
  const member = await prisma.teamMember.findUnique({
    where: { id: session.user.id },
    include: {
      role: { select: { id: true, name: true } },
    },
  });
  if (!member) throw new Error("Team member not found");

  return <ProfileCenter member={JSON.parse(JSON.stringify(member))} />;
}
