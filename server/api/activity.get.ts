import { getCached } from "../utils/runtimeCache";
import { getPrisma } from "../utils/prisma";

export default defineEventHandler(() =>
    getCached("activity", 60_000, async () => {
        const prisma = getPrisma();
        const server = { select: { id: true, name: true, logoUrl: true } };
        const [newest, reviews, votes] = await Promise.all([
            prisma.server.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, name: true, logoUrl: true, country: true, createdAt: true } }),
            prisma.review.findMany({ orderBy: { createdAt: "desc" }, take: 4, select: { rating: true, body: true, createdAt: true, userId: true, user: { select: { displayName: true } }, server } }),
            prisma.vote.findMany({ orderBy: { createdAt: "desc" }, take: 6, select: { createdAt: true, userId: true, user: { select: { displayName: true } }, server } }),
        ]);
        return {
            newest: newest.map((s) => ({ id: s.id, name: s.name, logoUrl: s.logoUrl, country: s.country, at: s.createdAt.getTime() })),
            reviews: reviews.map((r) => ({ rating: r.rating, body: r.body.slice(0, 140), at: r.createdAt.getTime(), author: r.user.displayName || "Member", authorId: r.userId, server: r.server })),
            votes: votes.map((v) => ({ at: v.createdAt.getTime(), voter: v.user.displayName || "Member", voterId: v.userId, server: v.server })),
        };
    }),
);
