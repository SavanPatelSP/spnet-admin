import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";

export async function GET() {
  try {
    await requirePermission("View Gem History");
    const rewards = await prisma.gemReward.findMany({
      orderBy: { name: "asc" },
    });
    return Response.json(rewards);
  } catch (error) {
    console.error("Gems rewards list error:", error);
    return Response.json({ error: "Failed to fetch rewards" }, { status: 500 });
  }
}
