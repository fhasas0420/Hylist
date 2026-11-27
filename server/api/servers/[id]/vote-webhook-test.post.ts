import { requireOwnedServer } from "../../../utils/ownerAccess";
import { hitRateLimit } from "../../../utils/rateLimit";
import { sendVoteWebhook } from "../../../utils/voteWebhook";

export default defineEventHandler(async (event) => {
    const { server } = await requireOwnedServer(event, { allowAdmin: false });
    if (!server.voteWebhookUrl) throw createError({ statusCode: 400, statusMessage: "Save a vote reward URL first", data: { message: "Save a vote reward URL first" } });
    if (!hitRateLimit(`vote-test:${server.id}`, 5, 60 * 1000)) throw createError({ statusCode: 429, statusMessage: "Too many tests, wait a minute", data: { message: "Too many tests, wait a minute" } });

    return sendVoteWebhook(server.voteWebhookUrl, server.verificationToken, {
        event: "test",
        serverId: server.id,
        serverName: server.name,
        playerName: "TestPlayer",
        votedAt: new Date().toISOString(),
    });
});
