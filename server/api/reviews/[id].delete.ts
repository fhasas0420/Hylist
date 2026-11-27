import { requireUser } from "../../utils/auth";
import { getPrisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
    const user = await requireUser(event);
    const id = String(event.context.params?.id || "").trim();
    const prisma = getPrisma();
    const review = await prisma.review.findUnique({ where: { id }, select: { userId: true } });
    if (!review) throw createError({ statusCode: 404, statusMessage: "Not found", data: { message: "Review not found" } });
    if (review.userId !== user.id && user.role !== "admin") throw createError({ statusCode: 403, statusMessage: "Forbidden", data: { message: "Forbidden" } });
    await prisma.review.delete({ where: { id } });
    return { ok: true };
});
