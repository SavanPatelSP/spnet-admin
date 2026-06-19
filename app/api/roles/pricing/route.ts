import { NextResponse } from "next/server";
import { ROLE_PRICES } from "@/lib/constants";
import { getRoleHierarchyLevel, getDefaultPermissions, getPermissionCounts, getCategoryCounts, calculateCosts } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  const pricing = Object.entries(ROLE_PRICES).map(([role, price]) => {
    const level = getRoleHierarchyLevel(role);
    const permInfo = getPermissionCounts(role);
    const costs = calculateCosts(role);
    return {
      role,
      price,
      hierarchyLevel: level,
      permissions: permInfo,
      costs,
    };
  });

  return NextResponse.json({ success: true, data: pricing });
}
