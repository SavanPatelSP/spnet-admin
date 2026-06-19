import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";

export async function POST(req: Request) {
  try {
    const session = await requireApiPermission("View License Events");
    const body = await req.json();
    const { licenseId, type, description, metadata, performedBy } = body;

    if (!licenseId) {
      return Response.json({ error: "License ID is required" }, { status: 400 });
    }

    if (!type?.trim()) {
      return Response.json({ error: "Event type is required" }, { status: 400 });
    }

    const license = await prisma.license.findUnique({ where: { id: licenseId } });

    if (!license) {
      return Response.json({ error: "License not found" }, { status: 404 });
    }

    const event = await prisma.licenseEvent.create({
      data: {
        licenseId,
        type,
        description,
        metadata: metadata ? JSON.stringify(metadata) : null,
        performedBy: performedBy || session.user.name,
      },
    });

    return Response.json(event, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
