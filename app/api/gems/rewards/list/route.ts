import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";

export async function GET() {
  try {
    await requireApiPermission("View Gem History");
    const rewards = await prisma.gemReward.findMany({
      orderBy: { name: "asc" },
    });
    return Response.json(rewards);
  } catch (error) {
    return handleApiError(error);
  }
}
