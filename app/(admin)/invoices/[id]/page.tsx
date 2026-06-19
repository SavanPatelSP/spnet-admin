import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth-helpers";
import InvoiceDetailClient from "@/components/invoices/InvoiceDetailClient";

export const metadata: Metadata = { title: "Invoice Details" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InvoiceDetailPage({ params }: Props) {
  await requirePermission("Manage Invoices");
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { license: { select: { key: true, organization: true, plan: true, teamMember: { select: { name: true, email: true } } } } },
  });

  if (!invoice) notFound();

  const auditHistory = await prisma.auditLog.findMany({
      where: {
        OR: [
          { entityId: id },
          invoice.licenseId ? { licenseId: invoice.licenseId } : {},
        ],
      },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <InvoiceDetailClient
      invoice={{
        ...invoice,
        issuedAt: invoice.issuedAt.toISOString(),
        dueAt: invoice.dueAt?.toISOString() || null,
        paidAt: invoice.paidAt?.toISOString() || null,
        createdAt: invoice.createdAt.toISOString(),
        updatedAt: invoice.updatedAt.toISOString(),
        archivedAt: invoice.archivedAt?.toISOString() || null,
        shareTokenExpiresAt: invoice.shareTokenExpiresAt?.toISOString() || null,
      }}
      auditHistory={auditHistory.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      }))}
    />
  );
}
