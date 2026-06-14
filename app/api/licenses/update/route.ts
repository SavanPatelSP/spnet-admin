import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

function parseExpiryDate(dateString: string) {
  const [year, month, day] =
    dateString.split("-").map(Number);

  return new Date(
    year,
    month - 1,
    day,
    12,
    0,
    0
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const expiryDate =
      body.expiresAt
        ? parseExpiryDate(
            body.expiresAt
          )
        : new Date(
            2027,
            11,
            31,
            12,
            0,
            0
          );

    const license =
      await prisma.license.update({
        where: {
          id: body.id,
        },

        data: {
          organization:
            body.organization,

          plan:
            body.plan,

          status:
            body.status,

          maxDevices:
            Number(
              body.maxDevices
            ),

          expiresAt:
            expiryDate,

          notes:
            body.notes ?? "",
        },
      });

    await logAudit(
      "LICENSE_UPDATED",
      license.id,
      `Updated ${license.organization}`
    );

    return Response.json(
      license
    );
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error:
          "Failed to update license",
      },
      {
        status: 500,
      }
    );
  }
}
