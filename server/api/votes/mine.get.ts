import { getSessionUser } from "../../utils/auth";
import { getPrisma } from "../../utils/prisma";
import { VOTE_COOLDOWN_MS, voterIpHash } from "../../utils/votes";

export default defineEventHandler(async (event) => {
    const user = await getSessionUser(event);
    if (!user) return { votes: {} };

    const since = new Date(Date.now() - VOTE_COOLDOWN_MS);
    const rows = await getPrisma().vote.findMany({
        where: { createdAt: { gt: since }, OR: [{ userId: user.id }, { ipHash: voterIpHash(event) }] },
        select: { serverId: true, createdAt: true },
    });

    const votes: Record<string, number> = {};
    for (const r of rows) {
        const next = r.createdAt.getTime() + VOTE_COOLDOWN_MS;
        if (!votes[r.serverId] || next > votes[r.serverId]!) votes[r.serverId] = next;
    }
    return { votes };
});
