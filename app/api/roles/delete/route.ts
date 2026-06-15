import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(req: Request) {
  const { id } = await req.json();

  const role = await prisma.role.findUnique({
    where: { id },
  });

  if (!role) {
    return NextResponse.json(
      { error: "Role not found" },
      { status: 404 }
    );
  }

  if (role.protected) {
    return NextResponse.json(
      { error: "Protected roles cannot be deleted" },
      { status: 403 }
    );
  }

  await prisma.permission.deleteMany({
    where: { roleId: id },
  });

  await prisma.role.delete({
    where: { id },
  });

  return NextResponse.json({
    success: true,
  });
}
