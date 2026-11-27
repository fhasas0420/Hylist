import { getSessionUser, isVipActive } from "../../utils/auth";
import { getPrisma } from "../../utils/prisma";
import { getPublicServers } from "../../utils/publicServers";

export default defineEventHandler(async (event) => {
    const id = String(event.context.params?.id || "").trim();
    const prisma = getPrisma();
    const [u, ranked, viewer] = await Promise.all([
        prisma.user.findUnique({ where: { id }, select: { id: true, displayName: true, avatarUrl: true, role: true, vipUntil: true, createdAt: true } }),
        getPublicServers(),
        getSessionUser(event),
    ]);
    if (!u) throw createError({ statusCode: 404, statusMessage: "User not found", data: { message: "User not found" } });

    const reviewSelect = { id: true, rating: true, body: true, createdAt: true, server: { select: { id: true, name: true, logoUrl: true } }, user: { select: { id: true, displayName: true } } };
    const [ownIds, votesReceived, votesCast, written, received] = await Promise.all([
        prisma.server.findMany({ where: { createdByUserId: id }, select: { id: true } }),
        prisma.vote.count({ where: { server: { createdByUserId: id } } }),
        prisma.vote.count({ where: { userId: id } }),
        prisma.review.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 20, select: reviewSelect }),
        prisma.review.findMany({ where: { server: { createdByUserId: id } }, orderBy: { createdAt: "desc" }, take: 20, select: reviewSelect }),
    ]);
    const mapReview = (r: (typeof written)[number]) => ({ id: r.id, rating: r.rating, body: r.body, at: r.createdAt.getTime(), server: r.server, author: { id: r.user.id, name: r.user.displayName || "Member" } });

    const own = new Set(ownIds.map((s) => s.id));
    const servers = ranked.map((s, i) => ({ ...s, rank: i + 1 })).filter((s) => own.has(s.id));

    return {
        user: {
            id: u.id,
            name: u.displayName || "Member",
            avatarUrl: u.avatarUrl,
            role: u.role === "admin" ? "admin" : u.role === "vip" && isVipActive(u) ? "vip" : "user",
            memberSince: u.createdAt.getTime(),
            isMe: viewer?.id === u.id,
        },
        stats: { servers: servers.length, votesReceived, votesCast, reviewsWritten: written.length },
        servers,
        reviewsReceived: received.map(mapReview),
        reviewsWritten: written.map(mapReview),
    };
});
