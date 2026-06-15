import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const member = await prisma.teamMember.create({
    data: {
      name: body.name,
      email: body.email,
      roleId: body.roleId,
    },
    include: {
      role: true,
    },
  });

  return NextResponse.json(member);
}
