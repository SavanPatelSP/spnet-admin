import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import CreateTeamMemberLicenseForm from "@/components/settings/team-members/CreateTeamMemberLicenseForm";

export const metadata: Metadata = { title: "Create Team Member & License" };

export default async function CreateTeamMemberLicensePage() {
  const [roles, tiers] = await Promise.all([
    prisma.role.findMany({ orderBy: { name: "asc" } }),
    prisma.licenseTemplate.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Create Team Member & License"
        description="Unified onboarding: create a team member, assign a license, and send the invite in one workflow."
      />
      <CreateTeamMemberLicenseForm roles={roles} templates={tiers} />
    </div>
  );
}
