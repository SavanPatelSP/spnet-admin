import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (token !== process.env.MIGRATION_TOKEN) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Role" ADD COLUMN "permissionsVersion" INTEGER NOT NULL DEFAULT 0;`
    );

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
