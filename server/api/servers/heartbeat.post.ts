import { readBody } from "h3";
import { invalidateCache } from "../../utils/runtimeCache";
import { normalizeHost, normalizePort } from "../../utils/serverStore";
import { getPrisma } from "../../utils/prisma";

function toOptionalInt(value: any) {
    if (value === null || value === undefined || value === "") return undefined;
    const n = Number(value);
    if (!Number.isFinite(n)) return undefined;
    return Math.trunc(n);
}

export default defineEventHandler(async (event) => {
    const body = await readBody(event);

    const host = normalizeHost(body?.host ?? body?.hostname);
    const port = normalizePort(body?.port);
    const token = String(body?.token || "").trim();
    if (!token) {
        throw createError({ statusCode: 400, statusMessage: "token is required", message: "token is required", data: { message: "token is required" } });
    }

    const players = toOptionalInt(body?.players);
    const capacity = toOptionalInt(body?.capacity);

    if (typeof players === "number" && (players < 0 || players > 1000000)) {
        throw createError({ statusCode: 400, statusMessage: "Invalid players", message: "Invalid players", data: { message: "Invalid players" } });
    }

    if (typeof capacity === "number" && (capacity < 0 || capacity > 1000000)) {
        throw createError({ statusCode: 400, statusMessage: "Invalid capacity", message: "Invalid capacity", data: { message: "Invalid capacity" } });
    }

    const prisma = getPrisma();
    const server = await prisma.server.findUnique({
        where: {
            host_port: {
                host: host.toLowerCase(),
                port,
            },
        },
    });

    if (!server) {
        throw createError({ statusCode: 404, statusMessage: "Server not found", message: "Server not found", data: { message: "Server not found" } });
    }

    if (String(server.verificationToken) !== token) {
        throw createError({ statusCode: 401, statusMessage: "Invalid token", message: "Invalid token", data: { message: "Invalid token" } });
    }

    const now = new Date();

    await prisma.server.update({
        where: { id: server.id },
        data: {
            lastSeenAt: now,
            heartbeatAt: now,
            heartbeatPlayers: typeof players === "number" ? players : null,
            heartbeatCapacity: typeof capacity === "number" ? capacity : null,
            verifiedAt: server.verifiedAt ?? now,
        },
    });

    invalidateCache("publicServers");

    return {
        ok: true,
        host: server.host,
        port: server.port,
        lastSeenAt: now.getTime(),
    };
});