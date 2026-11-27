import { readBody } from "h3";
import { requireUser, clearAuthSession } from "../../utils/auth";
import { getPrisma } from "../../utils/prisma";

function errorWithStatus(message: string, statusCode: number) {
    return createError({ statusCode, statusMessage: message, message, data: { message } });
}

export default defineEventHandler(async (event) => {
    const user = await requireUser(event);
    const body = await readBody(event);
    const password = String(body?.password || "");

    if (!password) throw errorWithStatus("Missing password", 400);

    const prisma = getPrisma();
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) throw errorWithStatus("User not found", 404);

    const bcrypt = await import("bcryptjs");
    const ok = await bcrypt.compare(password, dbUser.passwordHash);
    if (!ok) throw errorWithStatus("Invalid password", 400);

    await prisma.session.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });

    clearAuthSession(event);

    return { ok: true };
});
