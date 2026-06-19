import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireApiPermission("View Devices");

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return Response.json({ error: "Activation ID is required" }, { status: 400 });
    }

    const activation = await prisma.activation.findUnique({
      where: { id },
      include: {
        license: {
          select: { id: true, key: true, organization: true, plan: true, status: true, maxDevices: true, expiresAt: true },
        },
        fingerprint: true,
      },
    });

    if (!activation) {
      return Response.json({ error: "Activation not found" }, { status: 404 });
    }

    return Response.json({ success: true, data: activation });
  } catch (error) {
    return handleApiError(error);
  }
}
