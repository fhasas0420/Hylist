import { readMultipartFormData } from "h3";
import { requireUser } from "../../utils/auth";
import { MEDIA_ROOT, removeMediaUrl, sniffImageExt, validateServerMedia } from "../../utils/serverMedia";
import { getPrisma } from "../../utils/prisma";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

function errorWithStatus(message: string, statusCode: number) {
    return createError({ statusCode, statusMessage: message, message, data: { message } });
}

function getField(parts: any[], name: string): any | null {
    return parts.find((p) => p?.name === name) ?? null;
}

export default defineEventHandler(async (event) => {
    const user = await requireUser(event);

    const parts = await readMultipartFormData(event);
    if (!parts || parts.length === 0)
        throw errorWithStatus("Missing form data", 400);

    const file = getField(parts, "file");
    if (!file?.data) throw errorWithStatus("Missing file", 400);

    const buf: Buffer = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data);
    try {
        validateServerMedia("logo", buf.byteLength);
    } catch (e: any) {
        throw errorWithStatus(e.message, 400);
    }
    const ext = sniffImageExt(buf);
    if (!ext) throw errorWithStatus("Unsupported image type (png, jpg, webp, gif)", 400);

    const ownerDir = `users/${user.id}`;
    const fileName = `avatar.${ext}`;
    await mkdir(path.join(MEDIA_ROOT, "users", user.id), { recursive: true });
    await writeFile(path.join(MEDIA_ROOT, "users", user.id, fileName), buf);

    const publicUrl = `/server-media/${ownerDir}/${fileName}?v=${Date.now()}`;

    const prisma = getPrisma();
    const existing = await prisma.user.findUnique({ where: { id: user.id }, select: { avatarUrl: true } });
    await prisma.user.update({ where: { id: user.id }, data: { avatarUrl: publicUrl } });

    const old = String(existing?.avatarUrl || "").split("?")[0];
    if (old && old !== publicUrl.split("?")[0]) await removeMediaUrl(old, ownerDir);

    return { ok: true, url: publicUrl };
});
