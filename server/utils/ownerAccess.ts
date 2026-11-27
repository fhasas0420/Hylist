import type { H3Event } from "h3";
import { requireUser } from "./auth";
import { getPrisma } from "./prisma";

export async function requireOwnedServer(event: H3Event, { allowAdmin = true } = {}) {
    const user = await requireUser(event);
    const id = String(event.context.params?.id || "").trim();
    const server = await getPrisma().server.findUnique({ where: { id } });
    if (!server) throw createError({ statusCode: 404, statusMessage: "Not found", data: { message: "Not found" } });
    const isOwner = server.createdByUserId === user.id;
    if (!isOwner && !(allowAdmin && user.role === "admin"))
        throw createError({ statusCode: 403, statusMessage: "Forbidden", data: { message: "Forbidden" } });
    return { user, server };
}
