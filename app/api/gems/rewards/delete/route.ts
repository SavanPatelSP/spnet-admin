import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";

export async function POST(req: Request) {
  try {
    await requirePermission("Manage Rewards");
    const { id } = await req.json();

    if (!id) {
      return Response.json({ error: "Reward id is required" }, { status: 400 });
    }

    await prisma.gemReward.delete({ where: { id } });

    return Response.json({ success: true });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2025") {
      return Response.json({ error: "Reward not found" }, { status: 404 });
    }
    console.error("Gems reward delete error:", error);
    return Response.json({ error: "Failed to delete reward" }, { status: 500 });
  }
}
