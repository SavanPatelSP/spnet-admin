import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(req: Request) {
  const body = await req.json();

  await prisma.teamMember.delete({
    where: {
      id: body.id,
    },
  });

  return NextResponse.json({
    success: true,
  });
}
