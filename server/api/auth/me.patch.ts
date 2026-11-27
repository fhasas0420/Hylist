import { readBody } from "h3";
import { isDisplayNameTaken, requireUser, toPublicUser } from "../../utils/auth";
import { getPrisma } from "../../utils/prisma";
import { removeMediaUrl } from "../../utils/serverMedia";

function errorWithStatus(message: string, statusCode: number) {
    return createError({ statusCode, statusMessage: message, message, data: { message } });
}

export default defineEventHandler(async (event) => {
    const user = await requireUser(event);
    const body = await readBody(event);
    const prisma = getPrisma();
    const data: { displayName?: string; avatarUrl?: null } = {};

    if (body?.displayName !== undefined) {
        const displayName = String(body.displayName || "").trim();
        if (displayName.length < 2) throw errorWithStatus("Display name is too short", 400);
        if (displayName.length > 100) throw errorWithStatus("Display name is too long", 400);
        if (await isDisplayNameTaken(displayName, user.id)) throw errorWithStatus("That username is already taken", 400);
        data.displayName = displayName;
    }

    if (body?.avatarUrl !== undefined) {
        if (body.avatarUrl !== null) throw errorWithStatus("Use avatar upload to change the avatar", 400);
        data.avatarUrl = null;
    }

    const before = data.avatarUrl === null
        ? await prisma.user.findUnique({ where: { id: user.id }, select: { avatarUrl: true } })
        : null;
    const updated = await prisma.user.update({ where: { id: user.id }, data });
    if (before?.avatarUrl) await removeMediaUrl(before.avatarUrl, `users/${user.id}`);

    return { user: toPublicUser(updated) };
});
