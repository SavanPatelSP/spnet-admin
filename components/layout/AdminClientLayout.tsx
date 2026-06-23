"use client";

import { PermissionProvider } from "@/hooks/usePermissions";

export function AdminClientLayout({ permissions, children }: { permissions: string[]; children: React.ReactNode }) {
  return <PermissionProvider permissions={permissions}>{children}</PermissionProvider>;
}
