import { readBody } from "h3";
import { requireAdmin } from "../../../utils/auth";
import { getPrisma } from "../../../utils/prisma";

export default defineEventHandler(async (event) => {
    await requireAdmin(event);
    const id = String(event.context.params?.id || "").trim();
    const action = String((await readBody(event))?.action || "");
    if (!["resolved", "dismissed", "reopen"].includes(action))
        throw createError({ statusCode: 400, statusMessage: "Invalid action", data: { message: "Invalid action" } });

    const reopen = action === "reopen";
    const updated = await getPrisma().report.updateMany({
        where: { id },
        data: { resolvedAt: reopen ? null : new Date(), resolution: reopen ? null : action },
    });
    if (!updated.count) throw createError({ statusCode: 404, statusMessage: "Not found", data: { message: "Not found" } });
    return { ok: true };
});
