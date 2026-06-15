import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req: Request) {
  const body = await req.json();

  const member =
    await prisma.teamMember.update({
      where: {
        id: body.id,
      },
      data: {
        roleId: body.roleId,
      },
    });

  return NextResponse.json(member);
}
