import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

function generateKey() {
  return (
    "SPNET-" +
    randomBytes(8)
      .toString("hex")
      .toUpperCase()
  );
}

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
  const body = await req.json();

  if (!body.organization?.trim()) {
    return Response.json(
      { error: "Organization required" },
      { status: 400 }
    );
  }

  const expiryDate =
    body.expiresAt
      ? parseExpiryDate(body.expiresAt)
      : new Date(
          2027,
          11,
          31,
          12,
          0,
          0
        );

  const license =
    await prisma.license.create({
      data: {
        key: generateKey(),

        organization:
          body.organization,

        plan:
          body.plan ||
          "ENTERPRISE",

        status:
          body.status ||
          "ACTIVE",

        maxDevices:
          Number(
            body.maxDevices
          ) || 10,

        expiresAt:
          expiryDate,

        notes:
          body.notes || "",
      },
    });

  return Response.json(
    license
  );
}
