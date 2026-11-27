import { getQuery } from "h3";
import { getPrisma } from "../../../utils/prisma";

export default defineEventHandler(async (event) => {
    const id = String(event.context.params?.id || "").trim();
    const range = getQuery(event).range === "7d" ? "7d" : "24h";
    const hours = range === "7d" ? 24 * 7 : 24;
    const since = new Date(Date.now() - hours * 3600_000);

    const rows = await getPrisma().serverSample.findMany({
        where: { serverId: id, at: { gte: since } },
        orderBy: { at: "asc" },
        select: { at: true, online: true, players: true },
    });

    let points = rows.map((r) => ({ t: r.at.getTime(), players: r.players, online: r.online }));
    if (range === "7d") {
        const buckets = new Map<number, { sum: number; n: number; online: number; total: number }>();
        for (const p of points) {
            const key = Math.floor(p.t / 3600_000) * 3600_000;
            const b = buckets.get(key) ?? { sum: 0, n: 0, online: 0, total: 0 };
            b.total++;
            if (p.online) b.online++;
            if (typeof p.players === "number") (b.sum += p.players), b.n++;
            buckets.set(key, b);
        }
        points = [...buckets].map(([t, b]) => ({ t, players: b.n ? Math.round(b.sum / b.n) : null, online: b.online > 0 }));
    }

    const online = rows.filter((r) => r.online).length;
    const withPlayers = rows.filter((r) => typeof r.players === "number");
    return {
        range,
        points,
        peak: withPlayers.reduce((m, r) => Math.max(m, r.players!), 0),
        uptime: rows.length ? Math.round((online / rows.length) * 1000) / 10 : null,
    };
});
