import { readBody } from "h3";
import { requireUser, revokeOtherSessions } from "../../utils/auth";
import { getPrisma } from "../../utils/prisma";

function errorWithStatus(message: string, statusCode: number) {
    return createError({ statusCode, statusMessage: message, message, data: { message } });
}

export default defineEventHandler(async (event) => {
    const user = await requireUser(event);
    const body = await readBody(event);

    const oldPassword = String(body?.oldPassword || "");
    const newPassword = String(body?.newPassword || "");

    if (!oldPassword || !newPassword) {
        throw errorWithStatus("Missing password fields", 400);
    }
    if (newPassword.length < 6) {
        throw errorWithStatus("New password must be at least 6 characters", 400);
    }

    const prisma = getPrisma();
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) throw errorWithStatus("User not found", 404);

    const bcrypt = await import("bcryptjs");
    const ok = await bcrypt.compare(oldPassword, dbUser.passwordHash);
    if (!ok) throw errorWithStatus("Invalid current password", 400);

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });
    await revokeOtherSessions(event, user.id);

    return { ok: true };
});
