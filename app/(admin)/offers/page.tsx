import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Offers & Promotions" };

import { OffersPromotionsPage } from "@/components/offers/OffersPromotionsPage";

export default async function OffersPage() {
  await requirePermission("Manage Billing");
  const promotions = await prisma.promotion.findMany({ orderBy: { createdAt: "desc" } });
  const serialized = JSON.parse(JSON.stringify(promotions));
  return <OffersPromotionsPage initialPromotions={serialized} />;
}
