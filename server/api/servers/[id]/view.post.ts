import { getPrisma } from "../../../utils/prisma";
import { hitRateLimit } from "../../../utils/rateLimit";
import { voterIpHash } from "../../../utils/votes";

export default defineEventHandler(async (event) => {
    const id = String(event.context.params?.id || "").trim();
    if (!hitRateLimit(`view:${id}:${voterIpHash(event)}`, 1, 30 * 60 * 1000)) return { ok: true };

    const now = new Date();
    const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    try {
        await getPrisma().serverView.upsert({
            where: { serverId_day: { serverId: id, day } },
            create: { serverId: id, day, views: 1 },
            update: { views: { increment: 1 } },
        });
    } catch {
    }
    return { ok: true };
});
