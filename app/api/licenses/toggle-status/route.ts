import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const license =
      await prisma.license.findUnique({
        where: {
          id: body.id,
        },
      });

    if (!license) {
      return Response.json(
        { error: "License not found" },
        { status: 404 }
      );
    }

    const newStatus =
      license.status === "ACTIVE"
        ? "SUSPENDED"
        : "ACTIVE";

    const updated =
      await prisma.license.update({
        where: {
          id: body.id,
        },

        data: {
          status: newStatus,
        },
      });

    await logAudit(
      newStatus === "ACTIVE"
        ? "LICENSE_REACTIVATED"
        : "LICENSE_SUSPENDED",
      updated.id,
      `${updated.organization}`
    );

    return Response.json(
      updated
    );
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error: "Failed",
      },
      {
        status: 500,
      }
    );
  }
}
