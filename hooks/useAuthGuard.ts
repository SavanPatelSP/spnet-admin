"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface AuthGuardResult {
  user: { name?: string | null; email?: string | null; role?: string | null } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasPermission: (permission: string) => boolean;
}

export function useAuthGuard(requiredPermission?: string): AuthGuardResult {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (requiredPermission && session?.user?.role) {
      // Basic role-based permission check; extend as needed
      if (!hasPermissionForRole(session.user.role, requiredPermission)) {
        router.replace("/403");
        return;
      }
    }
    setIsLoading(false);
  }, [status, session, requiredPermission, router]);

  return {
    user: session?.user || null,
    isAuthenticated: status === "authenticated",
    isLoading,
    hasPermission: (perm: string) =>
      session?.user?.role ? hasPermissionForRole(session.user.role, perm) : false,
  };
}

function hasPermissionForRole(role: string, permission: string): boolean {
  // Admins and SuperAdmins have all permissions
  if (role === "SuperAdmin" || role === "Admin") return true;
  // Basic permissions for lower roles
  const basicPermissions: Record<string, string[]> = {
    Owner: ["View Premium", "Manage Invoices"],
  };
  const perms = basicPermissions[role] || [];
  return perms.includes(permission);
}
