import { requirePermission } from "@/lib/auth-helpers";

export default async function InvoiceAnalyticsLayout({ children }: { children: React.ReactNode }) {
  await requirePermission("Manage Billing");
  return <>{children}</>;
}
