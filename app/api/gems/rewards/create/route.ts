import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";

export async function POST(req: Request) {
  try {
    const session = await requireApiPermission("Manage Rewards");
    const { name, description, amount, cooldownDays } = await req.json();

    if (!name || !amount || amount < 1) {
      return Response.json({ error: "name and amount (positive integer) are required" }, { status: 400 });
    }

    const reward = await prisma.gemReward.create({
      data: {
        name,
        description: description || null,
        amount,
        cooldownDays: cooldownDays || null,
        createdBy: session.user.name,
      },
    });

    return Response.json(reward);
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2002") {
      return Response.json({ error: "A reward with this name already exists" }, { status: 409 });
    }
    return handleApiError(error);
  }
}
