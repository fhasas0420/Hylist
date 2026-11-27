import { getPrisma } from "../../../utils/prisma";
import { requireOwnedServer } from "../../../utils/ownerAccess";

const DAYS = 30;

export default defineEventHandler(async (event) => {
    const { server } = await requireOwnedServer(event);
    const prisma = getPrisma();

    const today = new Date();
    const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - (DAYS - 1)));

    const [views, votes, recent] = await Promise.all([
        prisma.serverView.findMany({ where: { serverId: server.id, day: { gte: start } }, select: { day: true, views: true } }),
        prisma.vote.findMany({ where: { serverId: server.id, createdAt: { gte: start } }, select: { createdAt: true } }),
        prisma.vote.findMany({
            where: { serverId: server.id },
            orderBy: { createdAt: "desc" },
            take: 10,
            select: { createdAt: true, playerName: true, user: { select: { displayName: true } } },
        }),
    ]);

    const key = (d: Date) => d.toISOString().slice(0, 10);
    const days = Array.from({ length: DAYS }, (_, i) => {
        const d = new Date(start.getTime() + i * 86400_000);
        return { day: key(d), views: 0, votes: 0 };
    });
    const byDay = new Map(days.map((d) => [d.day, d]));
    for (const v of views) {
        const d = byDay.get(key(v.day));
        if (d) d.views += v.views;
    }
    for (const v of votes) {
        const d = byDay.get(key(v.createdAt));
        if (d) d.votes++;
    }

    return {
        days,
        totals: { views: days.reduce((s, d) => s + d.views, 0), votes: days.reduce((s, d) => s + d.votes, 0) },
        recentVotes: recent.map((v) => ({ at: v.createdAt.getTime(), playerName: v.playerName, user: v.user?.displayName || "Unknown" })),
    };
});
