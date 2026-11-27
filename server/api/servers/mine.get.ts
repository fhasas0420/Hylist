import { getQuery } from "h3";
import { requireUser } from "../../utils/auth";
import { getPrisma } from "../../utils/prisma";
import { getServerStatus, mapWithConcurrency } from "../../utils/serverStatus";
import { tagsFromJson } from "../../utils/dbHelpers";
import { getVoteCounts } from "../../utils/votes";

export default defineEventHandler(async (event) => {
    const user = await requireUser(event);
    const { detailed } = getQuery(event) as any;
    const active = detailed === "1" || detailed === "true";

    const rows = await getPrisma().server.findMany({
        where: { createdByUserId: user.id },
        orderBy: [{ createdAt: "desc" }],
    });

    const counts = await getVoteCounts(rows.map((r) => r.id));
    const servers = await mapWithConcurrency(rows, 10, async (s) => {
        const st = await getServerStatus(s, { active });
        return {
            id: s.id,
            name: s.name,
            description: s.description ?? undefined,
            host: s.host,
            port: s.port,
            country: s.country ?? "Unknown",
            tags: tagsFromJson(s.tagsJson),
            verificationToken: s.verificationToken,
            createdAt: new Date(s.createdAt).getTime(),
            lastSeenAt: st.lastSeenAt,
            players: st.players,
            capacity: st.capacity,
            logoUrl: s.logoUrl ?? undefined,
            bannerUrl: s.bannerUrl ?? undefined,
            heartbeat: st.heartbeatAt
                ? { at: st.heartbeatAt, players: s.heartbeatPlayers ?? undefined, capacity: s.heartbeatCapacity ?? undefined }
                : undefined,
            votesMonth: counts[s.id]?.month ?? 0,
            votesTotal: counts[s.id]?.total ?? 0,
            online: st.online,
            status: st.status,
        };
    });

    return { servers };
});
