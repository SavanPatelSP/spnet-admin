import { requirePermission } from "@/lib/auth-helpers";

export default async function AuditLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("View Audit Logs");
  return <>{children}</>;
}
