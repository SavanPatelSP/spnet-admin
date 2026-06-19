import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function GET(req: Request) {
  try {
    await requireApiPermission("Manage License Features");
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return Response.json({ error: "License ID is required" }, { status: 400 });
    }

    const license = await prisma.license.findUnique({
      where: { id },
      select: { featureFlags: true },
    });

    if (!license) {
      return Response.json({ error: "License not found" }, { status: 404 });
    }

    let featureFlags: Record<string, unknown> | null = null;
    if (license.featureFlags) {
      try {
        featureFlags = JSON.parse(license.featureFlags);
      } catch {
        featureFlags = null;
      }
    }

    return Response.json({ featureFlags });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: Request) {
  try {
    const session = await requireApiPermission("Manage License Features");
    const body = await req.json();
    const { id, featureFlags } = body;

    if (!id) {
      return Response.json({ error: "License ID is required" }, { status: 400 });
    }

    if (featureFlags === undefined || featureFlags === null) {
      return Response.json({ error: "Feature flags are required" }, { status: 400 });
    }

    const license = await prisma.license.findUnique({ where: { id } });

    if (!license) {
      return Response.json({ error: "License not found" }, { status: 404 });
    }

    const flagsJson = JSON.stringify(featureFlags);

    const updated = await prisma.license.update({
      where: { id },
      data: { featureFlags: flagsJson },
    });

    await prisma.licenseEvent.create({
      data: {
        licenseId: id,
        type: "FEATURE_UPDATED",
        description: "Feature flags updated",
        metadata: flagsJson,
        performedBy: session.user.name,
      },
    });

    await logAudit(
      AUDIT_ACTIONS.LICENSE_FEATURE_FLAG_UPDATED,
      id,
      license.organization,
      session.user.role,
      session.user.name,
      `Updated feature flags for ${license.organization}`
    );

    return Response.json({ featureFlags: JSON.parse(updated.featureFlags || "{}") });
  } catch (error) {
    return handleApiError(error);
  }
}
