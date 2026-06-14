import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { randomBytes } from "crypto";

function generateKey() {
  return (
    "SPNET-" +
    randomBytes(8)
      .toString("hex")
      .toUpperCase()
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const license =
      await prisma.license.update({
        where: {
          id: body.id,
        },

        data: {
          key: generateKey(),
        },
      });

    await logAudit(
      "LICENSE_KEY_REGENERATED",
      license.id,
      `${license.organization}`
    );

    return Response.json(
      license
    );
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        error:
          "Failed to regenerate key",
      },
      {
        status: 500,
      }
    );
  }
}
