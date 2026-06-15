import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  const role = await prisma.role.create({
    data: {
      name: body.name,
      description: body.description,
      riskLevel: body.riskLevel,
      protected: body.protected,
    },
  });

  return NextResponse.json(role);
}
