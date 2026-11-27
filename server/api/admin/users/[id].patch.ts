import { readBody } from "h3";
import { requireAdmin } from "../../../utils/auth";
import { getPrisma } from "../../../utils/prisma";
import { invalidateCache } from "../../../utils/runtimeCache";

function errorWithStatus(message: string, statusCode: number) {
    return createError({ statusCode, statusMessage: message, message, data: { message } });
}

export default defineEventHandler(async (event) => {
    const admin = await requireAdmin(event);

    const id = String(event.context.params?.id || "").trim();
    if (!id) throw errorWithStatus("Missing user id", 400);

    const body = await readBody(event);
    const role = String(body?.role || "").trim();
    if (role !== "user" && role !== "vip" && role !== "admin") {
        throw errorWithStatus("Invalid role", 400);
    }
    if (id === admin.id && role !== "admin") {
        throw errorWithStatus("You can't remove your own admin role", 400);
    }

    let vipUntil: Date | null = null;
    if (role === "vip" && body?.vipUntil != null && body.vipUntil !== "") {
        vipUntil = new Date(body.vipUntil);
        if (Number.isNaN(vipUntil.getTime())) throw errorWithStatus("Invalid VIP end date", 400);
        if (vipUntil.getTime() <= Date.now()) throw errorWithStatus("VIP end date must be in the future", 400);
    }

    try {
        await getPrisma().user.update({ where: { id }, data: { role: role as any, vipUntil } });
    } catch {
        throw errorWithStatus("User not found", 404);
    }

    invalidateCache("publicServers");
    return { ok: true };
});
