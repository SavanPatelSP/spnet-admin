import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth-helpers";
import { approveRequest } from "@/lib/approval";
import { executeApprovedAction } from "@/lib/approval-executor";
import { prisma } from "@/lib/prisma";
import { ForbiddenError } from "@/lib/security/errors";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireApiPermission("Approve Requests");
    if (session.user.role !== "OWNER" && session.user.role !== "SUPER_ADMIN") {
      throw new ForbiddenError("Only Owner and Super Admin can approve requests");
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const note: string | undefined = body.note;

    const existing = await prisma.approvalRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Approval request not found" }, { status: 404 });
    }
    if (existing.status !== "PENDING") {
      return NextResponse.json({ error: "Approval request is not pending" }, { status: 400 });
    }

    const teamMember = await prisma.teamMember.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true },
    });
    if (!teamMember) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 });
    }

    const payload = existing.metadata ? JSON.parse(existing.metadata) : {};
    const actionType = payload._actionType as string;

    if (actionType) {
      const execResult = await executeApprovedAction(actionType, payload, {
        approvedBy: teamMember.id,
        approvedByName: teamMember.name || "Unknown",
        approvedByEmail: session.user.email || "unknown",
      });

      if (!execResult.success) {
        return NextResponse.json({ error: execResult.message }, { status: 500 });
      }
    }

    const result = await approveRequest(
      id,
      teamMember.id,
      teamMember.name || undefined,
      session.user.email || undefined,
      note,
    );

    return NextResponse.json({ request: result, executed: actionType ? true : false });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to approve request" },
      { status: 500 },
    );
  }
}
