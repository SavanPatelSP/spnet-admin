import { requirePermission } from "@/lib/auth-helpers";

export default async function CreateRoleLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("View Roles");
  return <>{children}</>;
}
