import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const roles = await prisma.role.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return NextResponse.json(roles);
}
