import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  await prisma.license.updateMany({
    where: {
      status: "ACTIVE",
    },
    data: {
      status: "SUSPENDED",
    },
  });

  return NextResponse.json({
    success: true,
  });
}
