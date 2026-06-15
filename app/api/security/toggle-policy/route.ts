import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req: Request) {
  const body = await req.json();

  const policy =
    await prisma.securityPolicy.update({
      where: {
        id: body.id,
      },
      data: {
        enabled: body.enabled,
      },
    });

  return NextResponse.json(policy);
}
