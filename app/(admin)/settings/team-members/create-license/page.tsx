import { requirePermission } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";

export default async function CreateTeamMemberLicensePage() {
  await requirePermission("View Team Members");
  redirect("/settings/team-members");
}
