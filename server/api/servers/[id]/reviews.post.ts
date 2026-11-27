import { readBody } from "h3";
import { requireUser } from "../../../utils/auth";
import { getPrisma } from "../../../utils/prisma";
import { hitRateLimit } from "../../../utils/rateLimit";

function fail(message: string, statusCode = 400) {
    return createError({ statusCode, statusMessage: message, data: { message } });
}

export default defineEventHandler(async (event) => {
    const user = await requireUser(event);
    const id = String(event.context.params?.id || "").trim();
    const body = await readBody(event);

    const rating = Number(body?.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw fail("Pick 1 to 5 stars");
    const text = String(body?.body ?? "").trim();
    if (text.length < 10) throw fail("Write at least 10 characters");
    if (text.length > 1000) throw fail("Keep it under 1000 characters");

    const prisma = getPrisma();
    const server = await prisma.server.findUnique({ where: { id }, select: { createdByUserId: true } });
    if (!server) throw fail("Server not found", 404);
    if (server.createdByUserId === user.id) throw fail("You can't review your own server");
    if (!hitRateLimit(`review:${user.id}`, 10, 60 * 60 * 1000)) throw fail("Too many reviews, try again later", 429);

    await prisma.review.upsert({
        where: { serverId_userId: { serverId: id, userId: user.id } },
        create: { serverId: id, userId: user.id, rating, body: text },
        update: { rating, body: text },
    });
    return { ok: true };
});
