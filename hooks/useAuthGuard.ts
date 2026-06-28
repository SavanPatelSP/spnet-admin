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
    if (requiredPermission && session?.user?.permissions) {
      if (!session.user.permissions.includes(requiredPermission)) {
        router.replace("/403");
        return;
      }
    }
    if (requiredPermission && !session?.user?.permissions) {
      router.replace("/403");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(false);
  }, [status, session, requiredPermission, router]);

  return {
    user: session?.user || null,
    isAuthenticated: status === "authenticated",
    isLoading,
    hasPermission: (perm: string) =>
      session?.user?.permissions?.includes(perm) ?? false,
  };
}
