import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, NotFoundError } from "@/lib/security/errors";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const token = searchParams.get("token");

    if (!token) {
      return Response.json({ success: false, error: "Token is required" }, { status: 400 });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { shareToken: token },
      include: { license: { select: { key: true, organization: true, plan: true } } },
    });

    if (!invoice) throw new NotFoundError("Invoice not found");

    const expired = invoice.shareTokenExpiresAt && invoice.shareTokenExpiresAt < new Date();
    if (expired) {
      return Response.json({ success: false, error: "Share link has expired" }, { status: 410 });
    }

    return Response.json({ success: true, invoice });
  } catch (err) {
    return handleApiError(err);
  }
}
