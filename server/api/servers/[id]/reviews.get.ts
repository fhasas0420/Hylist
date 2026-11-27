import { getSessionUser } from "../../../utils/auth";
import { getPrisma } from "../../../utils/prisma";
import { getRatings } from "../../../utils/reviews";

export default defineEventHandler(async (event) => {
    const id = String(event.context.params?.id || "").trim();
    const [rows, ratings, user] = await Promise.all([
        getPrisma().review.findMany({
            where: { serverId: id },
            orderBy: { createdAt: "desc" },
            take: 100,
            include: { user: { select: { displayName: true, avatarUrl: true } } },
        }),
        getRatings([id]),
        getSessionUser(event),
    ]);

    const reviews = rows.map((r) => ({
        id: r.id,
        rating: r.rating,
        body: r.body,
        createdAt: r.createdAt.getTime(),
        edited: r.updatedAt.getTime() - r.createdAt.getTime() > 60_000,
        author: { id: r.userId, name: r.user.displayName || "Member", avatarUrl: r.user.avatarUrl },
        mine: Boolean(user && r.userId === user.id),
    }));

    const breakdown = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: rows.filter((r) => r.rating === stars).length }));

    return {
        summary: ratings[id] ?? { avg: 0, count: 0 },
        breakdown,
        reviews,
        mine: reviews.find((r) => r.mine) ?? null,
        canModerate: user?.role === "admin",
    };
});
