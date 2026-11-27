import { readBody } from "h3";
import { requireUser } from "../../utils/auth";
import { getPrisma } from "../../utils/prisma";

function errorWithStatus(message: string, statusCode: number) {
    return createError({ statusCode, statusMessage: message, message, data: { message } });
}

export default defineEventHandler(async (event) => {
    const user = await requireUser(event);
    const body = await readBody(event);

    const newEmail = String(body?.newEmail || "").trim().toLowerCase();
    const password = String(body?.password || "");

    if (!newEmail || !newEmail.includes("@")) throw errorWithStatus("Invalid email", 400);
    if (!password) throw errorWithStatus("Missing password", 400);

    const prisma = getPrisma();
    const existing = await prisma.user.findUnique({ where: { email: newEmail } });
    if (existing) throw errorWithStatus("Email already in use", 400);

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) throw errorWithStatus("User not found", 404);

    const bcrypt = await import("bcryptjs");
    const ok = await bcrypt.compare(password, dbUser.passwordHash);
    if (!ok) throw errorWithStatus("Invalid password", 400);

    try {
        await prisma.user.update({ where: { id: user.id }, data: { email: newEmail } as any });
    } catch (e: any) {
        throw errorWithStatus("Failed to update email", 500);
    }

    return { ok: true };
});
