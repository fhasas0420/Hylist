import { readBody } from "h3";
import { requireUser } from "../../../utils/auth";
import { getPrisma } from "../../../utils/prisma";
import { hitRateLimit } from "../../../utils/rateLimit";
import { REPORT_REASONS } from "../../../utils/reports";

function fail(message: string, statusCode = 400) {
    return createError({ statusCode, statusMessage: message, data: { message } });
}

export default defineEventHandler(async (event) => {
    const user = await requireUser(event);
    const id = String(event.context.params?.id || "").trim();
    const body = await readBody(event);

    const reason = String(body?.reason || "");
    if (!(reason in REPORT_REASONS)) throw fail("Pick a reason");
    const details = String(body?.details ?? "").trim();
    if (details.length > 1000) throw fail("Details are too long (max 1000 characters)");
    if (reason === "other" && details.length < 5) throw fail("Describe the problem");

    const prisma = getPrisma();
    const server = await prisma.server.findUnique({ where: { id }, select: { id: true, createdByUserId: true } });
    if (!server) throw fail("Server not found", 404);
    if (server.createdByUserId === user.id) throw fail("You can't report your own server");
    if (!hitRateLimit(`report:${user.id}`, 5, 60 * 60 * 1000)) throw fail("Too many reports, try again later", 429);

    const open = await prisma.report.findFirst({ where: { serverId: id, userId: user.id, resolvedAt: null }, select: { id: true } });
    if (open) throw fail("You already reported this server. An admin will look at it.");

    await prisma.report.create({ data: { serverId: id, userId: user.id, reason, details: details || null } });
    return { ok: true };
});
