import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";

export async function POST(req: Request) {
  try {
    await requirePermission("Manage Rewards");
    const { id, name, description, amount, active, cooldownDays } = await req.json();

    if (!id) {
      return Response.json({ error: "Reward id is required" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (amount !== undefined) data.amount = amount;
    if (active !== undefined) data.active = active;
    if (cooldownDays !== undefined) data.cooldownDays = cooldownDays;

    const reward = await prisma.gemReward.update({
      where: { id },
      data,
    });

    return Response.json(reward);
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2002") {
      return Response.json({ error: "A reward with this name already exists" }, { status: 409 });
    }
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2025") {
      return Response.json({ error: "Reward not found" }, { status: 404 });
    }
    console.error("Gems reward update error:", error);
    return Response.json({ error: "Failed to update reward" }, { status: 500 });
  }
}
