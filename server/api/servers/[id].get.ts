import { requireUser } from "../../utils/auth";
import { getPrisma } from "../../utils/prisma";
import { tagsFromJson } from "../../utils/dbHelpers";
import { linksOf, verifyCode } from "../../utils/serverLinks";

function errorWithStatus(message: string, statusCode: number) {
    return createError({ statusCode, statusMessage: message, message, data: { message } });
}

export default defineEventHandler(async (event) => {
    const user = await requireUser(event);
    const id = String(event.context.params?.id || "").trim();
    if (!id) throw errorWithStatus("Missing server id", 400);

    const prisma = getPrisma();
    const data = await prisma.server.findUnique({ where: { id } });
    if (!data) throw errorWithStatus("Not found", 404);
    if (String(data.createdByUserId || "") !== user.id)
        throw errorWithStatus("Forbidden", 403);

    const server = {
        id: String(data.id),
        name: String(data.name),
        description:
            data.description != null ? String(data.description) : undefined,
        host: String(data.host),
        port: Number(data.port),
        country: String(data.country ?? "Unknown"),
        tags: tagsFromJson((data as any).tagsJson),
        logoUrl: data.logoUrl != null ? String(data.logoUrl) : undefined,
        bannerUrl: data.bannerUrl != null ? String(data.bannerUrl) : undefined,
        verificationToken: String(data.verificationToken),
        verifyCode: verifyCode(String(data.verificationToken)),
        verifiedAt: data.verifiedAt ? data.verifiedAt.getTime() : null,
        ...linksOf(data),
        voteWebhookUrl: data.voteWebhookUrl ?? "",
        createdAt: new Date(data.createdAt ?? Date.now()).getTime(),
        lastSeenAt: data.lastSeenAt
            ? new Date(data.lastSeenAt).getTime()
            : undefined,
        heartbeat: data.heartbeatAt
            ? {
                at: new Date(data.heartbeatAt).getTime(),
                players:
                    typeof data.heartbeatPlayers === "number"
                        ? data.heartbeatPlayers
                        : undefined,
                capacity:
                    typeof data.heartbeatCapacity === "number"
                        ? data.heartbeatCapacity
                        : undefined,
            }
            : undefined,
    };

    return { server };
});