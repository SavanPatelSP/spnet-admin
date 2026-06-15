import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(req: Request) {
  const body = await req.json();

  await prisma.permission.deleteMany({
    where: {
      roleId: body.roleId,
    },
  });

  if (body.permissions?.length) {
    await prisma.permission.createMany({
      data: body.permissions.map(
        (permission: string) => ({
          roleId: body.roleId,
          permission,
        })
      ),
    });
  }

  return NextResponse.json({
    success: true,
  });
}
