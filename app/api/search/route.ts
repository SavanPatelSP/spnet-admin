import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();

    if (!q || q.length < 2) {
      return Response.json({ success: true, data: [] });
    }

    const results: {
      licenses: { id: string; key: string; organization: string; plan: string; status: string }[];
      teamMembers: { id: string; name: string; email: string; role: string; status: string }[];
      premium: { id: string; licenseId: string; plan: string; action: string }[];
      coins: { id: string; licenseId: string; balance: number }[];
      gems: { id: string; licenseId: string; balance: number }[];
      auditLogs: { id: string; action: string; description: string | null; createdAt: Date }[];
    } = {
      licenses: [],
      teamMembers: [],
      premium: [],
      coins: [],
      gems: [],
      auditLogs: [],
    };

    const userPermissions = session.user.permissions;

    const [licenses, teamMembers, premium, coins, gems, auditLogs] = await Promise.all([
      userPermissions.some((p) => p.includes("License"))
        ? prisma.license.findMany({
            where: {
              OR: [
                { key: { contains: q } },
                { organization: { contains: q } },
              ],
            },
            take: 5,
            orderBy: { createdAt: "desc" },
          })
        : [],
      userPermissions.some((p) => p.includes("Team"))
        ? prisma.teamMember.findMany({
            where: {
              OR: [
                { name: { contains: q } },
                { email: { contains: q } },
              ],
            },
            include: { role: true },
            take: 5,
          })
        : [],
      userPermissions.some((p) => p.includes("Premium"))
        ? prisma.premiumSubscription.findMany({
            where: {
              license: {
                OR: [
                  { key: { contains: q } },
                  { organization: { contains: q } },
                ],
              },
            },
            take: 5,
            orderBy: { createdAt: "desc" },
          })
        : [],
      userPermissions.some((p) => p.includes("Coins") || p.includes("Coin"))
        ? prisma.coinBalance.findMany({
            where: { license: { OR: [{ key: { contains: q } }, { organization: { contains: q } }] } },
            include: { license: { select: { key: true, organization: true } } },
            take: 5,
          })
        : [],
      userPermissions.some((p) => p.includes("Gems") || p.includes("Gem"))
        ? prisma.gemBalance.findMany({
            where: { license: { OR: [{ key: { contains: q } }, { organization: { contains: q } }] } },
            include: { license: { select: { key: true, organization: true } } },
            take: 5,
          })
        : [],
      userPermissions.some((p) => p.includes("Audit"))
        ? prisma.auditLog.findMany({
            where: {
              OR: [
                { action: { contains: q } },
                { description: { contains: q } },
                { actorEmail: { contains: q } },
              ],
            },
            take: 5,
            orderBy: { createdAt: "desc" },
          })
        : [],
    ]);

    results.licenses = licenses.map((l) => ({ id: l.id, key: l.key, organization: l.organization, plan: l.plan, status: l.status }));
    results.teamMembers = teamMembers.map((m) => ({ id: m.id, name: m.name, email: m.email, role: m.role.name, status: m.status }));
    results.premium = premium.map((p) => ({ id: p.id, licenseId: p.licenseId, plan: p.plan, action: p.action }));
    results.coins = coins.map((c) => ({ id: c.id, licenseId: c.licenseId, balance: c.balance }));
    results.gems = gems.map((g) => ({ id: g.id, licenseId: g.licenseId, balance: g.balance }));
    results.auditLogs = auditLogs.map((a) => ({ id: a.id, action: a.action, description: a.description, createdAt: a.createdAt }));

    return Response.json({ success: true, data: results });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Search failed";
    if (message.includes("redirect")) throw e;
    return Response.json({ success: false, error: message, data: [] }, { status: 500 });
  }
}
