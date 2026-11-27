import { getSessionUser } from "../../../utils/auth";
import { getPrisma } from "../../../utils/prisma";
import { getPublicServers } from "../../../utils/publicServers";
import { linksOf } from "../../../utils/serverLinks";

export default defineEventHandler(async (event) => {
    const id = String(event.context.params?.id || "").trim();
    const prisma = getPrisma();
    const [servers, row, user, lastVotes] = await Promise.all([
        getPublicServers(),
        prisma.server.findUnique({
            where: { id },
            select: {
                createdAt: true,
                host: true,
                port: true,
                createdByUserId: true,
                createdByUser: { select: { displayName: true } },
                name: true,
                description: true,
                country: true,
                logoUrl: true,
                bannerUrl: true,
                discordUrl: true,
                websiteUrl: true,
                storeUrl: true,
                youtubeUrl: true,
                tiktokUrl: true,
                twitterUrl: true,
                instagramUrl: true,
            },
        }),
        getSessionUser(event),
        prisma.vote.findMany({
            where: { serverId: id },
            orderBy: { createdAt: "desc" },
            take: 8,
            select: { createdAt: true, userId: true, user: { select: { displayName: true, avatarUrl: true } } },
        }),
    ]);
    if (!row) throw createError({ statusCode: 404, statusMessage: "Server not found", data: { message: "Server not found" } });

    const index = servers.findIndex((s) => s.id === id);
    const base = index >= 0
        ? servers[index]!
        : { id, name: row.name, description: row.description ?? undefined, country: row.country, logoUrl: row.logoUrl ?? undefined, bannerUrl: row.bannerUrl ?? undefined, online: false, tags: [], votesMonth: 0, votesTotal: 0, rating: { avg: 0, count: 0 } };

    return {
        server: {
            ...base,
            host: row.host,
            port: row.port,
            rank: index >= 0 ? index + 1 : null,
            createdAt: row.createdAt.getTime(),
            links: linksOf(row),
            ownerName: row.createdByUser?.displayName || null,
            ownerId: row.createdByUserId,
            isOwner: Boolean(user && user.id === row.createdByUserId),
            lastVotes: lastVotes.map((v) => ({ at: v.createdAt.getTime(), userId: v.userId, name: v.user?.displayName || "Member", avatarUrl: v.user?.avatarUrl ?? null })),
        },
    };
});
