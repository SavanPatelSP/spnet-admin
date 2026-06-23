import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Licensing" };

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/ui/PageHeader";
import { LicensingDashboard } from "@/components/settings/licensing/LicensingDashboard";

export default async function LicensingSettingsPage() {
  await requirePermission("View Licenses");
  const licenses = await prisma.license.findMany({
    include: { activations: { select: { id: true, createdAt: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Licensing"
        description="Monitor license health, usage, and lifecycle across all organizations."
      />
      <LicensingDashboard licenses={licenses as never} />
    </div>
  );
}
