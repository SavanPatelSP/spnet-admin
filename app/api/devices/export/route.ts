import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/security/errors";

export const dynamic = "force-dynamic";

function escapeCSV(value: unknown): string {
  const str = value == null ? "" : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  try {
    await requireApiPermission("Export Device Data");

    const activations = await prisma.activation.findMany({
      include: {
        license: {
          select: { key: true, plan: true, organization: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const headers = [
      "Device Name",
      "Device ID",
      "IP Address",
      "OS",
      "OS Version",
      "Browser",
      "Browser Version",
      "Device Type",
      "Trust Score",
      "Status",
      "Last Seen",
      "Country",
      "City",
      "ISP",
      "License Key",
      "License Plan",
      "License Organization",
      "Created At",
    ];

    const rows = activations.map((a) =>
      [
        a.deviceName,
        a.deviceId,
        a.ipAddress,
        a.os,
        a.osVersion,
        a.browser,
        a.browserVersion,
        a.deviceType,
        a.trustScore,
        a.status,
        a.lastSeenAt?.toISOString() ?? "",
        a.country,
        a.city,
        a.isp,
        a.license.key,
        a.license.plan,
        a.license.organization,
        a.createdAt.toISOString(),
      ].map(escapeCSV).join(",")
    );

    const bom = "\uFEFF";
    const csv = bom + headers.join(",") + "\n" + rows.join("\n");
    const date = new Date().toISOString().split("T")[0];
    const filename = `devices-export-${date}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
