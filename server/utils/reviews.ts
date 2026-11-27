import { getPrisma } from "./prisma";

export type Rating = { avg: number; count: number };

export async function getRatings(serverIds?: string[]): Promise<Record<string, Rating>> {
    const rows = await getPrisma().review.groupBy({
        by: ["serverId"],
        where: serverIds ? { serverId: { in: serverIds } } : {},
        _avg: { rating: true },
        _count: { _all: true },
    });
    return Object.fromEntries(rows.map((r) => [r.serverId, { avg: Math.round((r._avg.rating ?? 0) * 10) / 10, count: r._count._all }]));
}
