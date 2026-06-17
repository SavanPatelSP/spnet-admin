import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { requirePermission } from "@/lib/auth-helpers";
import { AUDIT_ACTIONS } from "@/lib/constants";

export async function GET(req: Request) {
  try {
    await requirePermission("Manage License Tags");
    const url = new URL(req.url);
    const licenseId = url.searchParams.get("licenseId");

    if (!licenseId) {
      return Response.json({ error: "License ID is required" }, { status: 400 });
    }

    const tags = await prisma.licenseTag.findMany({
      where: { licenseId },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(tags);
  } catch (error) {
    console.error("Tags get error:", error);
    return Response.json({ error: "Failed to get tags" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requirePermission("Manage License Tags");
    const body = await req.json();
    const { licenseId, name, color } = body;

    if (!licenseId) {
      return Response.json({ error: "License ID is required" }, { status: 400 });
    }

    if (!name?.trim()) {
      return Response.json({ error: "Tag name is required" }, { status: 400 });
    }

    const license = await prisma.license.findUnique({ where: { id: licenseId } });

    if (!license) {
      return Response.json({ error: "License not found" }, { status: 404 });
    }

    const tag = await prisma.licenseTag.create({
      data: {
        licenseId,
        name: name.trim(),
        color: color || "gray",
      },
    });

    await prisma.licenseEvent.create({
      data: {
        licenseId,
        type: "TAG_ADDED",
        description: `Tag "${name}" added`,
        metadata: JSON.stringify({ tagId: tag.id, name: tag.name, color: tag.color }),
        performedBy: session.user.name,
      },
    });

    await logAudit(
      AUDIT_ACTIONS.LICENSE_TAG_ADDED,
      licenseId,
      license.organization,
      session.user.role,
      session.user.name,
      `Added tag "${name}" to license for ${license.organization}`
    );

    return Response.json(tag, { status: 201 });
  } catch (error: unknown) {
    if ((error as Record<string, unknown>)?.code === "P2002") {
      return Response.json({ error: "Tag with this name already exists for this license" }, { status: 409 });
    }
    console.error("Tag create error:", error);
    return Response.json({ error: "Failed to create tag" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await requirePermission("Manage License Tags");
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return Response.json({ error: "Tag ID is required" }, { status: 400 });
    }

    const tag = await prisma.licenseTag.findUnique({
      where: { id },
      include: { license: true },
    });

    if (!tag) {
      return Response.json({ error: "Tag not found" }, { status: 404 });
    }

    await prisma.licenseTag.delete({ where: { id } });

    await prisma.licenseEvent.create({
      data: {
        licenseId: tag.licenseId,
        type: "TAG_REMOVED",
        description: `Tag "${tag.name}" removed`,
        metadata: JSON.stringify({ tagId: tag.id, name: tag.name }),
        performedBy: session.user.name,
      },
    });

    await logAudit(
      AUDIT_ACTIONS.LICENSE_TAG_REMOVED,
      tag.licenseId,
      tag.license.organization,
      session.user.role,
      session.user.name,
      `Removed tag "${tag.name}" from license for ${tag.license.organization}`
    );

    return Response.json({ success: true });
  } catch (error) {
    console.error("Tag delete error:", error);
    return Response.json({ error: "Failed to delete tag" }, { status: 500 });
  }
}
