import { requireAdmin } from "../../../utils/auth";
import { getPrisma } from "../../../utils/prisma";
import { tagsFromJson } from "../../../utils/dbHelpers";

function errorWithStatus(message: string, statusCode: number) {
    return createError({ statusCode, statusMessage: message, message, data: { message } });
}

export default defineEventHandler(async (event) => {
    await requireAdmin(event);

    const id = String(event.context.params?.id || "").trim();
    if (!id) throw errorWithStatus("Missing server id", 400);

    const prisma = getPrisma();
    const s = await prisma.server.findUnique({ where: { id } });
    if (!s) throw errorWithStatus("Not found", 404);

    return {
        id: String(s.id),
        name: String(s.name),
        description: s.description != null ? String(s.description) : undefined,
        host: String(s.host),
        port: Number(s.port),
        country: String(s.country ?? "Unknown"),
        tags: tagsFromJson((s as any).tagsJson),
        logoUrl: s.logoUrl != null ? String(s.logoUrl) : undefined,
        bannerUrl: s.bannerUrl != null ? String(s.bannerUrl) : undefined,
        createdAt: s.createdAt ? new Date(s.createdAt).getTime() : null,
        createdByUserId: s.createdByUserId ?? null,
        lastSeenAt: s.lastSeenAt ? new Date(s.lastSeenAt).getTime() : null,
        isFeatured: Boolean(s.isFeatured),
    };
});