import { readBody } from "h3";
import { requireUser } from "../../utils/auth";
import { assertPublicHost, isPublicHost } from "../../utils/publicHost";
import { linksOf, normalizeLinks, normalizeUrl } from "../../utils/serverLinks";
import { invalidateCache } from "../../utils/runtimeCache";
import { getPrisma } from "../../utils/prisma";
import {
    normalizeCountry,
    normalizeHost,
    normalizePort,
    normalizeTags,
} from "../../utils/serverStore";
import { tagsFromJson, tagsToJson } from "../../utils/dbHelpers";
import { removeMediaUrl } from "../../utils/serverMedia";

function errorWithStatus(message: string, statusCode: number) {
    return createError({ statusCode, statusMessage: message, message, data: { message } });
}

export default defineEventHandler(async (event) => {
    const user = await requireUser(event);
    const id = String(event.context.params?.id || "").trim();
    if (!id) throw errorWithStatus("Missing server id", 400);

    const body = await readBody(event);

    const prisma = getPrisma();
    const existing = await prisma.server.findUnique({ where: { id } });
    if (!existing) throw errorWithStatus("Not found", 404);
    if (String(existing.createdByUserId || "") !== user.id)
        throw errorWithStatus("Forbidden", 403);

    try {
        const name = String(body?.name ?? existing.name ?? "").trim();
        if (name.length < 2) throw new Error("Name is too short");
        if (name.length > 56) throw new Error("Name is too long");

        const description = String(
            body?.description ?? existing.description ?? "",
        ).trim();
        if (description.length > 2000) throw new Error("Description is too long");

        const host = normalizeHost(String(body?.host ?? existing.host ?? ""));
        await assertPublicHost(host);
        const port = normalizePort(body?.port ?? existing.port);
        const country = normalizeCountry(
            String(body?.country ?? existing.country ?? ""),
        );
        const tags = body?.tags === undefined
            ? tagsFromJson(existing.tagsJson)
            : normalizeTags(
                Array.isArray(body.tags)
                    ? body.tags
                    : String(body.tags || "")
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
            );

        const links = normalizeLinks(body);
        const voteWebhookUrl = body?.voteWebhookUrl === undefined ? existing.voteWebhookUrl : normalizeUrl(body.voteWebhookUrl, "Vote reward URL");
        if (voteWebhookUrl && voteWebhookUrl !== existing.voteWebhookUrl && !(await isPublicHost(new URL(voteWebhookUrl).hostname.replace(/^\[|\]$/g, ""))))
            throw new Error("Vote reward URL must point to a public address");

        const nextHost = host.toLowerCase();
        const nextPort = port;
        const changedHostPort =
            String(existing.host || "").toLowerCase() !== nextHost ||
            Number(existing.port) !== nextPort;

        if (changedHostPort) {
            const dupe = await prisma.server.findFirst({
                where: {
                    host: nextHost,
                    port: nextPort,
                    NOT: { id },
                },
                select: { id: true },
            });
            if (dupe?.id) throw new Error("That server is already listed");
        }

        const updated = await prisma.server.update({
            where: { id },
            data: {
                name,
                host: nextHost,
                port: nextPort,
                country,
                tagsJson: tagsToJson(tags),
                description,
                ...links,
                voteWebhookUrl,
                verifiedAt: changedHostPort ? null : undefined,
                logoUrl: body?.logoUrl === null ? null : undefined,
                bannerUrl: body?.bannerUrl === null ? null : undefined,
            },
        });

        if (body?.logoUrl === null) await removeMediaUrl(existing.logoUrl, id);
        if (body?.bannerUrl === null) await removeMediaUrl(existing.bannerUrl, id);
        invalidateCache("publicServers");

        const server = {
            id: updated.id,
            name: updated.name,
            description: updated.description ?? undefined,
            host: updated.host,
            port: updated.port,
            country: updated.country,
            tags: tagsFromJson((updated as any).tagsJson),
            logoUrl: updated.logoUrl ?? undefined,
            bannerUrl: updated.bannerUrl ?? undefined,
            verificationToken: updated.verificationToken,
            ...linksOf(updated),
            createdAt: new Date(updated.createdAt ?? Date.now()).getTime(),
            createdByUserId: updated.createdByUserId ?? undefined,
            lastSeenAt: updated.lastSeenAt
                ? new Date(updated.lastSeenAt).getTime()
                : undefined,
            heartbeat: updated.heartbeatAt
                ? {
                    at: new Date(updated.heartbeatAt).getTime(),
                    players: updated.heartbeatPlayers ?? undefined,
                    capacity: updated.heartbeatCapacity ?? undefined,
                }
                : undefined,
        };

        return { ok: true, server };
    } catch (e: any) {
        if (typeof e?.statusCode === "number") throw e;
        if (e?.code === "P2002") throw errorWithStatus("That server is already listed", 400);
        throw errorWithStatus(String(e?.message || "Failed to update server"), 400);
    }
});