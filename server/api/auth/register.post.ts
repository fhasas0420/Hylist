import { getRequestIP, readBody } from "h3";
import { createSession, registerUser } from "../../utils/auth";
import { hitRateLimit } from "../../utils/rateLimit";

export default defineEventHandler(async (event) => {
    const ip = getRequestIP(event, { xForwardedFor: true }) || "unknown";
    if (!hitRateLimit(`register:${ip}`, 5, 60 * 60 * 1000)) {
        throw createError({ statusCode: 429, statusMessage: "Too many registrations, try again later", message: "Too many registrations, try again later", data: { message: "Too many registrations, try again later" } });
    }

    const body = await readBody(event);
    const { user, session } = await registerUser({
        email: String(body?.email ?? ""),
        password: String(body?.password ?? ""),
        displayName: String(body?.displayName ?? ""),
    });

    createSession(event, session);
    return { user };
});
