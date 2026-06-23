import { requirePermission } from "@/lib/auth-helpers";
import { InvoicesPage } from "@/components/invoices/InvoicesPage";

export default async function InvoicesRoute() {
  await requirePermission("Manage Billing");
  return <InvoicesPage />;
}
