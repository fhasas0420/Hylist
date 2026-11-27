import { countOtherSessions, requireUser } from "../../utils/auth";
import { getPrisma } from "../../utils/prisma";
import { getPublicServers } from "../../utils/publicServers";
import { VOTE_COOLDOWN_MS } from "../../utils/votes";

export default defineEventHandler(async (event) => {
    const user = await requireUser(event);
    const prisma = getPrisma();

    const [me, ranked, own, votesCast, votesReceived, voted, otherSessions] = await Promise.all([
        prisma.user.findUnique({ where: { id: user.id }, select: { createdAt: true } }),
        getPublicServers(),
        prisma.server.findMany({ where: { createdByUserId: user.id }, orderBy: { createdAt: "desc" }, select: { id: true, name: true, logoUrl: true } }),
        prisma.vote.count({ where: { userId: user.id } }),
        prisma.vote.count({ where: { server: { createdByUserId: user.id } } }),
        prisma.vote.groupBy({
            by: ["serverId"],
            where: { userId: user.id },
            _max: { createdAt: true },
            _count: { _all: true },
            orderBy: { _max: { createdAt: "desc" } },
            take: 20,
        }),
        countOtherSessions(event, user.id),
    ]);

    const rankOf = new Map(ranked.map((s, i) => [s.id, i + 1]));
    const byId = new Map(ranked.map((s) => [s.id, s]));

    const servers = own.map((s) => {
        const p = byId.get(s.id);
        return {
            id: s.id,
            name: s.name,
            logoUrl: s.logoUrl ?? undefined,
            online: p?.online ?? false,
            players: p?.players,
            capacity: p?.capacity,
            rank: rankOf.get(s.id) ?? null,
            verified: p?.verified ?? false,
            votesMonth: p?.votesMonth ?? 0,
            votesTotal: p?.votesTotal ?? 0,
        };
    });

    const votes = voted
        .map((v) => {
            const p = byId.get(v.serverId);
            if (!p) return null;
            const last = v._max.createdAt?.getTime() ?? 0;
            return {
                server: { id: p.id, name: p.name, logoUrl: p.logoUrl, online: p.online, voteRewards: p.voteRewards, votesMonth: p.votesMonth },
                count: v._count._all,
                lastVotedAt: last,
                nextVoteAt: last + VOTE_COOLDOWN_MS > Date.now() ? last + VOTE_COOLDOWN_MS : null,
            };
        })
        .filter(Boolean);

    return {
        memberSince: me?.createdAt.getTime() ?? null,
        stats: {
            servers: servers.length,
            online: servers.filter((s) => s.online).length,
            votesReceived,
            votesCast,
        },
        servers,
        votes,
        otherSessions,
    };
});
