import { getCached } from "./runtimeCache";
import { toDisplayIp, type PublicServer } from "./serverStore";
import { getServerStatus, mapWithConcurrency } from "./serverStatus";
import { isVipActive } from "./auth";
import { getPrisma } from "./prisma";
import { tagsFromJson } from "./dbHelpers";
import { getVoteCounts } from "./votes";
import { getRatings, type Rating } from "./reviews";

export const PUBLIC_TTL_MS = 1000 * 60 * 5;

export async function getPublicServers(): Promise<(PublicServer & { votesMonth: number; votesTotal: number; rating: Rating })[]> {
    const { servers: cached } = await getCached("publicServers", PUBLIC_TTL_MS, async () => {
        const rows = await getPrisma().server.findMany({
            orderBy: [{ createdAt: "desc" }],
            include: { createdByUser: { select: { role: true, vipUntil: true } } },
        });

        const servers = await mapWithConcurrency(rows, 10, async (s): Promise<PublicServer> => {
            const st = await getServerStatus(s);
            return {
                id: s.id,
                name: s.name,
                description: s.description ?? undefined,
                tags: tagsFromJson(s.tagsJson),
                ip: toDisplayIp(s),
                country: s.country ?? "Unknown",
                isFeatured: s.isFeatured,
                isSponsored: s.createdByUser ? isVipActive(s.createdByUser) : false,
                verified: Boolean(s.verifiedAt),
                voteRewards: Boolean(s.voteWebhookUrl),
                logoUrl: s.logoUrl ?? undefined,
                bannerUrl: s.bannerUrl ?? undefined,
                online: st.online,
                status: st.status,
                ping: st.ping,
                players: st.players,
                capacity: st.capacity,
                lastSeenAt: st.lastSeenAt,
            };
        });
        return { servers };
    });

    const [counts, ratings] = await Promise.all([getVoteCounts(), getRatings()]);
    const servers = cached.map((s) => ({
        ...s,
        votesMonth: counts[s.id]?.month ?? 0,
        votesTotal: counts[s.id]?.total ?? 0,
        rating: ratings[s.id] ?? { avg: 0, count: 0 },
    }));

    const tier = (s: PublicServer) => (s.isFeatured ? 2 : 0) + (s.isSponsored ? 1 : 0);
    servers.sort((a, b) => tier(b) - tier(a) || b.votesMonth - a.votesMonth || b.votesTotal - a.votesTotal);
    return servers;
}
