import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const activation =
      await prisma.activation.findUnique({
        where: {
          id: body.id,
        },
        include: {
          license: true,
        },
      });

    if (!activation) {
      return Response.json(
        {
          error: "Device not found",
        },
        {
          status: 404,
        }
      );
    }

    await prisma.activation.delete({
      where: {
        id: activation.id,
      },
    });

    await logAudit(
      "DEVICE_REVOKED",
      activation.license.id,
      activation.license.organization,
      "SUPER_ADMIN",
      "Savan Patel",
      `Revoked device ${
        activation.deviceName ??
        activation.deviceId
      }`
    );

    return Response.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error:
          "Failed to revoke device",
      },
      {
        status: 500,
      }
    );
  }
}
