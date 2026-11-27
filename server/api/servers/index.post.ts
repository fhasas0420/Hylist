import { readBody } from "h3";
import { invalidateCache } from "../../utils/runtimeCache";
import { requireUser } from "../../utils/auth";
import { assertPublicHost } from "../../utils/publicHost";
import { getPrisma } from "../../utils/prisma";
import {
    normalizeCountry,
    normalizeHost,
    normalizePort,
    normalizeTags,
} from "../../utils/serverStore";
import { randomBytes } from "node:crypto";
import { tagsToJson, tagsFromJson } from "../../utils/dbHelpers";
import { hitRateLimit } from "../../utils/rateLimit";
import { notifyServerAdded } from "../../utils/discordWebhook";
import { toDisplayIp } from "../../utils/serverStore";
import { normalizeLinks } from "../../utils/serverLinks";

function errorWithStatus(message: string, statusCode: number) {
    return createError({ statusCode, statusMessage: message, message, data: { message } });
}

export default defineEventHandler(async (event) => {
    const user = await requireUser(event);
    if (!hitRateLimit(`add-server:${user.id}`, 10, 60 * 60 * 1000))
        throw errorWithStatus("Too many servers added, try again later", 429);
    const body = await readBody(event);

    try {
        const name = String(body?.name || "").trim();
        if (name.length < 2) throw new Error("Name is too short");
        if (name.length > 56) throw new Error("Name is too long");

        const host = normalizeHost(String(body?.host ?? ""));
        await assertPublicHost(host);
        const port = normalizePort(body?.port);
        const country = normalizeCountry(String(body?.country ?? ""));
        const tags = normalizeTags(
            Array.isArray(body?.tags)
                ? body.tags
                : String(body?.tags || "")
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
        );

        const description = String(body?.description ?? "").trim();
        if (description.length > 2000) throw new Error("Description is too long");
        const links = normalizeLinks(body);

        const prisma = getPrisma();
        const existing = await prisma.server.findUnique({
            where: {
                host_port: {
                    host: host.toLowerCase(),
                    port,
                },
            },
            select: { id: true },
        });

        if (existing?.id) throw new Error("That server is already listed");

        const verificationToken = randomBytes(24).toString("hex");

        const inserted = await prisma.server.create({
            data: {
                name,
                host: host.toLowerCase(),
                port,
                country,
                tagsJson: tagsToJson(tags),
                verificationToken,
                createdByUserId: user.id,
                description: description || null,
                ...links,
            },
        });

        const server = {
            id: inserted.id,
            name: inserted.name,
            description: inserted.description ?? undefined,
            host: inserted.host,
            port: inserted.port,
            country: inserted.country,
            tags: tagsFromJson((inserted as any).tagsJson),
            verificationToken: inserted.verificationToken,
            createdAt: new Date(inserted.createdAt ?? Date.now()).getTime(),
            createdByUserId: inserted.createdByUserId ?? undefined,
            lastSeenAt: inserted.lastSeenAt
                ? new Date(inserted.lastSeenAt).getTime()
                : undefined,
            heartbeat: inserted.heartbeatAt
                ? {
                    at: new Date(inserted.heartbeatAt).getTime(),
                    players: inserted.heartbeatPlayers ?? undefined,
                    capacity: inserted.heartbeatCapacity ?? undefined,
                }
                : undefined,
        };

        invalidateCache("publicServers");

        notifyServerAdded(
            { id: inserted.id, name: inserted.name, ip: toDisplayIp(inserted), country: inserted.country, tags, description: inserted.description },
            user.displayName || "Unknown",
        ).catch(() => { });

        return { ok: true, server };
    } catch (e: any) {
        if (typeof e?.statusCode === "number") throw e;
        if (e?.code === "P2002") throw errorWithStatus("That server is already listed", 400);
        throw errorWithStatus(e?.message || "Failed to add server", 400);
    }
});