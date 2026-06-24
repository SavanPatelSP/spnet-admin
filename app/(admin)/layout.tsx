import AdminSidebar from "@/components/layout/AdminSidebar";
import AdminHeader from "@/components/layout/AdminHeader";
import { AdminFooter } from "@/components/layout/AdminFooter";
import { AdminClientLayout } from "@/components/layout/AdminClientLayout";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { getAuthSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAuthSession();
  if (!session) {
    redirect("/login");
  }

  const rolePermissionsVersion = session.user.rolePermissionsVersion ?? 0;

  return (
    <AdminClientLayout
      permissions={session.user.permissions}
      rolePermissionsVersion={rolePermissionsVersion}
    >
      <div className="flex min-h-screen">
        <AdminSidebar permissions={session.user.permissions} userRole={session.user.role} />
        <div className="flex flex-1 flex-col">
          <AdminHeader />
          <main className="flex-1 p-6">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
          <AdminFooter />
        </div>
      </div>
    </AdminClientLayout>
  );
}
