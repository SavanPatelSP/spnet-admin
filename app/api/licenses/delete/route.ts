import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();

  await prisma.license.delete({
    where: {
      id: body.id,
    },
  });

  return Response.json({
    success: true,
  });
}
