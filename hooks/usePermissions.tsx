"use client";

import { createContext, useContext, useMemo, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface PermissionContextType {
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
}

const PermissionContext = createContext<PermissionContextType>({
  permissions: [],
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
});

const POLL_INTERVAL_MS = 30_000;

async function checkPermissionVersion(): Promise<{
  changed: boolean;
  permissions?: string[];
  version?: number;
}> {
  try {
    const res = await fetch("/api/auth/permissions/check");
    if (!res.ok) return { changed: false };
    return await res.json();
  } catch {
    return { changed: false };
  }
}

export function PermissionProvider({ permissions: initialPermissions, children }: { permissions: string[]; children: ReactNode }) {
  const [permissions, setPermissions] = useState(initialPermissions);
  const router = useRouter();

  useEffect(() => {
    setPermissions(initialPermissions);
  }, [initialPermissions]);

  useEffect(() => {
    let mounted = true;
    const interval = setInterval(async () => {
      const result = await checkPermissionVersion();
      if (!mounted) return;
      if (result.changed && result.permissions) {
        setPermissions(result.permissions);
        router.refresh();
      }
    }, POLL_INTERVAL_MS);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [router]);

  const value = useMemo<PermissionContextType>(() => ({
    permissions,
    hasPermission: (permission: string) => permissions.includes(permission),
    hasAnyPermission: (perms: string[]) => perms.some((p) => permissions.includes(p)),
    hasAllPermissions: (perms: string[]) => perms.every((p) => permissions.includes(p)),
  }), [permissions]);

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermission() {
  return useContext(PermissionContext);
}
