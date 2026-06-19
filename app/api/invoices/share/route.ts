import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError, NotFoundError } from "@/lib/security/errors";
import { AUTH_URL } from "@/lib/constants";
import crypto from "crypto";

const SHARE_TOKEN_EXPIRY_DAYS = 30;

export async function POST(req: NextRequest) {
  try {
    await requireApiPermission("Manage Invoices");
    const body = await req.json();
    const { invoiceId } = body;

    if (!invoiceId) {
      return Response.json({ success: false, error: "Invoice ID is required" }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundError("Invoice not found");

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + SHARE_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { shareToken: token, shareTokenExpiresAt: expiresAt },
    });

    const link = `${AUTH_URL}/invoice/share/${token}`;
    return Response.json({ success: true, link, token, expiresAt: expiresAt.toISOString() });
  } catch (err) {
    return handleApiError(err);
  }
}
