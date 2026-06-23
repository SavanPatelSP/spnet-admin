import { requirePermission } from "@/lib/auth-helpers";

export default async function CreateRoleLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("Create Roles");
  return <>{children}</>;
}
