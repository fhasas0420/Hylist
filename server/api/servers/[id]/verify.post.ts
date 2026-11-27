import net from "node:net";
import { resolveTxt } from "node:dns/promises";
import { getPrisma } from "../../../utils/prisma";
import { requireOwnedServer } from "../../../utils/ownerAccess";
import { hitRateLimit } from "../../../utils/rateLimit";
import { invalidateCache } from "../../../utils/runtimeCache";
import { verifyCode } from "../../../utils/serverLinks";

function fail(message: string, statusCode = 400) {
    return createError({ statusCode, statusMessage: message, data: { message } });
}

export default defineEventHandler(async (event) => {
    const { server } = await requireOwnedServer(event, { allowAdmin: false });
    if (server.verifiedAt) return { ok: true, verified: true };
    if (!hitRateLimit(`verify:${server.id}`, 5, 10 * 60 * 1000)) throw fail("Too many attempts, wait a few minutes", 429);
    if (net.isIP(server.host)) throw fail("DNS verification needs a domain. With a plain IP, use the heartbeat instead.");

    const code = verifyCode(server.verificationToken);
    let records: string[] = [];
    try {
        records = (await resolveTxt(server.host)).map((parts) => parts.join(""));
    } catch {
    }
    if (!records.some((r) => r.trim() === code))
        throw fail(`TXT record not found on ${server.host}. DNS changes can take a few minutes.`);

    await getPrisma().server.update({ where: { id: server.id }, data: { verifiedAt: new Date() } });
    invalidateCache("publicServers");
    return { ok: true, verified: true };
});
