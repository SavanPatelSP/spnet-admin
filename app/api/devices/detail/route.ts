import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requirePermission("View Devices");

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
    console.error("Device detail error:", error);
    return Response.json({ error: "Failed to fetch device details" }, { status: 500 });
  }
}
