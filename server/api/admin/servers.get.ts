import { requireAdmin } from "../../utils/auth";
import { getPrisma } from "../../utils/prisma";
import { tagsFromJson } from "../../utils/dbHelpers";

export default defineEventHandler(async (event) => {
    await requireAdmin(event);

    const prisma = getPrisma();
    const rows = await prisma.server.findMany({
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        include: {
            createdByUser: { select: { id: true, displayName: true, role: true } },
        },
    });

    const servers = rows.map((s: any) => {
        const ownerId =
            s.createdByUserId != null ? String(s.createdByUserId) : null;
        const owner = s.createdByUser || null;

        return {
            id: String(s.id),
            name: String(s.name),
            description: s.description != null ? String(s.description) : undefined,
            host: String(s.host),
            port: Number(s.port),
            country: String(s.country ?? "Unknown"),
            tags: tagsFromJson(s.tagsJson),
            createdAt: s.createdAt ? new Date(s.createdAt).getTime() : null,
            createdByUserId: ownerId,
            ownerDisplayName:
                owner?.displayName != null ? String(owner.displayName) : null,
            ownerRole: owner?.role != null ? String(owner.role) : null,
            lastSeenAt: s.lastSeenAt ? new Date(s.lastSeenAt).getTime() : null,
            isFeatured: Boolean(s.isFeatured),
        };
    });

    return { servers };
});