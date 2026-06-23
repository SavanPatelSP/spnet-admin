"use client";

import { PermissionProvider } from "@/hooks/usePermissions";

export function AdminClientLayout({ permissions, rolePermissionsVersion, children }: { permissions: string[]; rolePermissionsVersion: number; children: React.ReactNode }) {
  return <PermissionProvider permissions={permissions}>{children}</PermissionProvider>;
}
