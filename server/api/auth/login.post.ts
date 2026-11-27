import { getRequestIP, readBody } from "h3";
import { createSession, loginUser } from "../../utils/auth";
import { hitRateLimit, resetRateLimit } from "../../utils/rateLimit";

const WINDOW_MS = 15 * 60 * 1000;

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const email = String(body?.email ?? "").trim().toLowerCase();
    const ip = getRequestIP(event, { xForwardedFor: true }) || "unknown";
    const key = `login:${ip}:${email}`;

    if (!hitRateLimit(key, 10, WINDOW_MS)) {
        throw createError({ statusCode: 429, statusMessage: "Too many attempts, try again later", message: "Too many attempts, try again later", data: { message: "Too many attempts, try again later" } });
    }

    const { user, session } = await loginUser({ email, password: String(body?.password ?? "") });
    resetRateLimit(key);
    createSession(event, session);
    return { user };
});
