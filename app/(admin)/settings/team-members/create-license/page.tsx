import { requirePermission } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";

export default async function CreateTeamMemberLicensePage() {
  await requirePermission("Create Team Members");
  redirect("/settings/team-members");
}
