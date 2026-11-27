import { readMultipartFormData } from "h3";
import { requireUser } from "../../../utils/auth";
import { invalidateCache } from "../../../utils/runtimeCache";
import {
    MEDIA_ROOT,
    removeMediaUrl,
    sniffImageExt,
    type ServerMediaKind,
    validateServerMedia,
} from "../../../utils/serverMedia";
import { getPrisma } from "../../../utils/prisma";
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

    const id = String(event.context.params?.id || "").trim();
    if (!id) throw errorWithStatus("Missing server id", 400);

    const prisma = getPrisma();
    const server = await prisma.server.findUnique({
        where: { id },
        select: { id: true, createdByUserId: true, logoUrl: true, bannerUrl: true },
    });

    if (!server) throw errorWithStatus("Not found", 404);

    const isOwner = String(server.createdByUserId || "") === user.id;
    const isAdmin = user.role === "admin";
    if (!isOwner && !isAdmin) throw errorWithStatus("Forbidden", 403);

    const parts = await readMultipartFormData(event);
    if (!parts || parts.length === 0)
        throw errorWithStatus("Missing form data", 400);

    const kindRaw = String(getField(parts, "kind")?.data || "")
        .trim()
        .toLowerCase();
    if (kindRaw !== "logo" && kindRaw !== "banner")
        throw errorWithStatus("Invalid kind (logo|banner)", 400);
    const kind = kindRaw as ServerMediaKind;

    const file = getField(parts, "file");
    if (!file?.data) throw errorWithStatus("Missing file", 400);

    const buf: Buffer = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data);
    try {
        validateServerMedia(kind, buf.byteLength);
    } catch (e: any) {
        throw errorWithStatus(e.message, 400);
    }
    const ext = sniffImageExt(buf);
    if (!ext) throw errorWithStatus("Unsupported image type (png, jpg, webp, gif)", 400);

    const fileName = `${kind}.${ext}`;
    await mkdir(path.join(MEDIA_ROOT, server.id), { recursive: true });
    await writeFile(path.join(MEDIA_ROOT, server.id, fileName), buf);

    const publicUrl = `/server-media/${server.id}/${fileName}?v=${Date.now()}`;
    const oldUrl = kind === "logo" ? server.logoUrl : server.bannerUrl;

    await prisma.server.update({
        where: { id },
        data: kind === "logo" ? { logoUrl: publicUrl } : { bannerUrl: publicUrl },
    });

    const old = String(oldUrl || "").split("?")[0];
    if (old && old !== publicUrl.split("?")[0]) await removeMediaUrl(old, server.id);

    invalidateCache("publicServers");

    return { ok: true, url: publicUrl };
});
