import { clearAuthSession, revokeCurrentSession } from "../../utils/auth";

export default defineEventHandler(async (event) => {
    await revokeCurrentSession(event);
    clearAuthSession(event);
    return { ok: true };
});
