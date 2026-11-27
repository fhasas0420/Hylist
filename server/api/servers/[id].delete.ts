import { requireUser } from "../../utils/auth";
import { invalidateCache } from "../../utils/runtimeCache";
import { getPrisma } from "../../utils/prisma";
import { removeServerMediaDir } from "../../utils/serverMedia";

function errorWithStatus(message: string, statusCode: number) {
    return createError({ statusCode, statusMessage: message, message, data: { message } });
}

export default defineEventHandler(async (event) => {
    const user = await requireUser(event);
    const id = String(event.context.params?.id || "").trim();
    if (!id) throw errorWithStatus("Missing server id", 400);

    const prisma = getPrisma();
    const existing = await prisma.server.findUnique({
        where: { id },
        select: { id: true, createdByUserId: true },
    });
    if (!existing) throw errorWithStatus("Not found", 404);
    if (String(existing.createdByUserId || "") !== user.id)
        throw errorWithStatus("Forbidden", 403);

    await prisma.server.delete({ where: { id } });
    await removeServerMediaDir(id);

    invalidateCache("publicServers");

    return { ok: true };
});