import { readBody } from "h3";
import { requireUser } from "../../../utils/auth";
import { getPrisma } from "../../../utils/prisma";
import { hitRateLimit } from "../../../utils/rateLimit";
import { getVoteCounts, nextVoteAt, VOTE_COOLDOWN_MS, voterIpHash } from "../../../utils/votes";
import { sendVoteWebhook } from "../../../utils/voteWebhook";

function errorWithStatus(message: string, statusCode: number, data: Record<string, any> = {}) {
    return createError({ statusCode, statusMessage: message, message, data: { message, ...data } });
}

const PLAYER_NAME = /^[A-Za-z0-9_]{3,16}$/;

export default defineEventHandler(async (event) => {
    const user = await requireUser(event);
    const id = String(event.context.params?.id || "").trim();
    if (!id) throw errorWithStatus("Missing server id", 400);

    const body = (await readBody(event).catch(() => null)) || {};
    const playerName = String(body?.playerName ?? "").trim() || null;
    if (playerName && !PLAYER_NAME.test(playerName)) throw errorWithStatus("Player name must be 3–16 letters, digits or _", 400);

    const server = await getPrisma().server.findUnique({
        where: { id },
        select: { id: true, name: true, createdByUserId: true, voteWebhookUrl: true, verificationToken: true },
    });
    if (!server) throw errorWithStatus("Server not found", 404);
    if (server.createdByUserId === user.id) throw errorWithStatus("You can't vote for your own server", 400);

    if (!hitRateLimit(`vote:${id}:${user.id}`, 1, 5000)) throw errorWithStatus("Vote already sent", 429);

    const ipHash = voterIpHash(event);
    const next = await nextVoteAt(id, user.id, ipHash);
    if (next) throw errorWithStatus("You already voted for this server today", 429, { nextVoteAt: next });

    const vote = await getPrisma().vote.create({ data: { serverId: id, userId: user.id, ipHash, playerName } });

    if (server.voteWebhookUrl) {
        sendVoteWebhook(server.voteWebhookUrl, server.verificationToken, {
            event: "vote",
            serverId: server.id,
            serverName: server.name,
            playerName,
            votedAt: vote.createdAt.toISOString(),
        }).catch(() => { });
    }

    const counts = (await getVoteCounts([id]))[id] ?? { month: 0, total: 0 };
    return { ok: true, votes: counts, nextVoteAt: Date.now() + VOTE_COOLDOWN_MS };
});
