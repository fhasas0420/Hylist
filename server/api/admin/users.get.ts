import { getQuery } from "h3";
import { isVipActive, requireAdmin } from "../../utils/auth";
import { getPrisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
    await requireAdmin(event);

    const q = (getQuery(event) as any) || {};
    const page = Math.max(1, Math.trunc(Number(q.page ?? 1) || 1));
    const perPage = Math.min(
        200,
        Math.max(1, Math.trunc(Number(q.perPage ?? 50) || 50)),
    );
    const search = String(q.q ?? "")
        .trim()
        .toLowerCase();

    const prisma = getPrisma();
    const usersRaw = await prisma.user.findMany({
        where: search
            ? {
                email: {
                    contains: search,
                },
            }
            : undefined,
        orderBy: [{ createdAt: "desc" }],
        skip: (page - 1) * perPage,
        take: perPage,
    });

    const users = usersRaw.map((u) => ({
        id: String(u.id),
        email: String(u.email ?? ""),
        createdAt: u.createdAt ? new Date(u.createdAt).getTime() : null,
        lastSignInAt: u.lastSignInAt ? new Date(u.lastSignInAt).getTime() : null,
        displayName: String(u.displayName ?? ""),
        role:
            u.role === "admin" || u.role === "vip" || u.role === "user"
                ? (u.role as any)
                : "user",
        vipUntil: u.vipUntil ? new Date(u.vipUntil).getTime() : null,
        vipActive: isVipActive(u),
    }));

    return { users, page, perPage };
});