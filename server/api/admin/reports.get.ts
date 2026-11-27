import { getQuery } from "h3";
import { requireAdmin } from "../../utils/auth";
import { getPrisma } from "../../utils/prisma";
import { REPORT_REASONS, type ReportReason } from "../../utils/reports";

export default defineEventHandler(async (event) => {
    await requireAdmin(event);
    const status = getQuery(event).status === "closed" ? "closed" : "open";
    const prisma = getPrisma();

    const [rows, openCount] = await Promise.all([
        prisma.report.findMany({
            where: { resolvedAt: status === "open" ? null : { not: null } },
            orderBy: { createdAt: "desc" },
            take: 200,
            include: {
                server: { select: { id: true, name: true, host: true, port: true } },
                user: { select: { displayName: true } },
            },
        }),
        prisma.report.count({ where: { resolvedAt: null } }),
    ]);

    return {
        openCount,
        reports: rows.map((r) => ({
            id: r.id,
            reason: r.reason,
            reasonLabel: REPORT_REASONS[r.reason as ReportReason] ?? r.reason,
            details: r.details,
            createdAt: r.createdAt.getTime(),
            resolvedAt: r.resolvedAt?.getTime() ?? null,
            resolution: r.resolution,
            reporter: r.user?.displayName || "Deleted user",
            server: { id: r.server.id, name: r.server.name, address: `${r.server.host}:${r.server.port}` },
        })),
    };
});
