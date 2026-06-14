import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const license = await prisma.license.findUnique({
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

    return Response.json(updated);
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Failed" },
      { status: 500 }
    );
  }
}
