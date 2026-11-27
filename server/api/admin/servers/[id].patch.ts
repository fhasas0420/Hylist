import { readBody } from "h3";
import { requireAdmin } from "../../../utils/auth";
import { invalidateCache } from "../../../utils/runtimeCache";
import {
    normalizeHost,
    normalizePort,
    normalizeCountry,
    normalizeTags,
} from "../../../utils/serverStore";
import { getPrisma } from "../../../utils/prisma";
import { tagsToJson } from "../../../utils/dbHelpers";
import { assertPublicHost } from "../../../utils/publicHost";
import { removeMediaUrl } from "../../../utils/serverMedia";

function errorWithStatus(message: string, statusCode: number) {
    return createError({ statusCode, statusMessage: message, message, data: { message } });
}

export default defineEventHandler(async (event) => {
    await requireAdmin(event);

    const id = String(event.context.params?.id || "").trim();
    if (!id) throw errorWithStatus("Missing server id", 400);

    const body = await readBody(event);
    const prisma = getPrisma();
    const updates: any = {};

    if (body?.name != null) {
        const name = String(body.name || "").trim();
        if (name.length < 2) throw errorWithStatus("Name is too short", 400);
        if (name.length > 56) throw errorWithStatus("Name is too long", 400);
        updates.name = name;
    }

    if (body?.host != null || body?.port != null) {
        const current = await prisma.server.findUnique({
            where: { id },
            select: { host: true, port: true },
        });
        if (!current) throw errorWithStatus("Not found", 404);

        const hostInput =
            body?.host != null ? String(body.host) : String((current as any).host);
        const portInput = body?.port != null ? body.port : (current as any).port;

        let host: string, port: number;
        try {
            host = normalizeHost(hostInput);
            port = normalizePort(portInput);
            await assertPublicHost(host);
        } catch (e: any) {
            throw errorWithStatus(e.message, 400);
        }
        const nextHost = host.toLowerCase();
        const nextPort = port;

        const dupe = await prisma.server.findFirst({
            where: {
                host: nextHost,
                port: nextPort,
                NOT: { id },
            },
            select: { id: true },
        });
        if (dupe?.id) throw errorWithStatus("That server is already listed", 400);

        updates.host = nextHost;
        updates.port = nextPort;
    }

    if (body?.country != null) {
        updates.country = normalizeCountry(String(body.country ?? ""));
    }

    if (body?.tags != null) {
        const tags = Array.isArray(body.tags)
            ? body.tags
            : String(body.tags || "")
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
        updates.tagsJson = tagsToJson(normalizeTags(tags));
    }

    if (body?.description != null) {
        const desc = String(body.description || "");
        if (desc.length > 2000)
            throw errorWithStatus("Description is too long", 400);
        updates.description = desc;
    }

    if (body?.isFeatured != null) {
        updates.isFeatured = Boolean(body.isFeatured);
    }

    if (body?.logoUrl === null) updates.logoUrl = null;
    if (body?.bannerUrl === null) updates.bannerUrl = null;

    if (Object.keys(updates).length === 0) {
        throw errorWithStatus("No valid fields to update", 400);
    }

    const before = await prisma.server.findUnique({ where: { id }, select: { logoUrl: true, bannerUrl: true } });
    if (!before) throw errorWithStatus("Not found", 404);
    try {
        await prisma.server.update({ where: { id }, data: updates });
    } catch (e: any) {
        throw errorWithStatus(e?.code === "P2002" ? "That server is already listed" : "Failed to update server", 400);
    }
    if (updates.logoUrl === null) await removeMediaUrl(before.logoUrl, id);
    if (updates.bannerUrl === null) await removeMediaUrl(before.bannerUrl, id);

    invalidateCache("publicServers");

    return { ok: true };
});