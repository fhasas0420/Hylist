import { requireUser, revokeOtherSessions } from "../../../utils/auth";

export default defineEventHandler(async (event) => {
    const user = await requireUser(event);
    await revokeOtherSessions(event, user.id);
    return { ok: true };
});
