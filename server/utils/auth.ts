import type { H3Event } from "h3";
import { deleteCookie, getCookie, setCookie } from "h3";
import { SignJWT, jwtVerify } from "jose";
import { createHash, randomBytes } from "node:crypto";
import { getPrisma } from "./prisma";

export type PublicUser = {
    id: string;
    email: string;
    displayName: string;
    avatarUrl?: string | null;
    role: "user" | "vip" | "admin";
    vipUntil: number | null;
};

export function isVipActive(db: { role?: string | null; vipUntil?: Date | string | null }): boolean {
    if (String(db?.role) !== "vip") return false;
    if (!db.vipUntil) return true;
    return new Date(db.vipUntil).getTime() > Date.now();
}

const ACCESS_COOKIE = "bombas_access_token";
const REFRESH_COOKIE = "bombas_refresh_token";

const ACCESS_TTL_SEC = 60 * 15;
const REFRESH_TTL_SEC = 60 * 60 * 24 * 30;

function cookieOpts() {
    return {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.COOKIE_SECURE
            ? process.env.COOKIE_SECURE === "true"
            : process.env.NODE_ENV === "production",
    };
}

function errorWithStatus(message: string, statusCode: number) {
    return createError({ statusCode, statusMessage: message, message, data: { message } });
}

function mustGetSecret(value: string | undefined, name: string) {
    const v = String(value || "").trim();
    if (!v) throw new Error(`Missing ${name}`);
    return v;
}

function getJwtSecretKey() {
    const config = useRuntimeConfig();
    const secret = mustGetSecret(
        (config as any).authJwtSecret || process.env.AUTH_JWT_SECRET,
        "AUTH_JWT_SECRET",
    );
    return new TextEncoder().encode(secret);
}

function getRefreshPepper() {
    const config = useRuntimeConfig();
    return mustGetSecret(
        (config as any).authRefreshPepper || process.env.AUTH_REFRESH_PEPPER,
        "AUTH_REFRESH_PEPPER",
    );
}

function sha256Hex(input: string): string {
    return createHash("sha256").update(input).digest("hex");
}

function hashRefreshToken(token: string): string {
    return sha256Hex(`${getRefreshPepper()}:${token}`);
}

export function toPublicUser(db: any): PublicUser {
    let role = String(db?.role || "user");
    if (role !== "admin" && role !== "vip") role = "user";
    if (role === "vip" && !isVipActive(db)) role = "user";
    return {
        id: String(db?.id || ""),
        email: String(db?.email || ""),
        displayName: String(db?.displayName || ""),
        avatarUrl: db?.avatarUrl || null,
        role: role as PublicUser["role"],
        vipUntil: role === "vip" && db?.vipUntil ? new Date(db.vipUntil).getTime() : null,
    };
}

async function signAccessToken(userId: string): Promise<string> {
    return await new SignJWT({})
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(userId)
        .setIssuedAt()
        .setExpirationTime(`${ACCESS_TTL_SEC}s`)
        .sign(getJwtSecretKey());
}

async function verifyAccessToken(
    token: string,
): Promise<{ userId: string } | null> {
    try {
        const res = await jwtVerify(token, getJwtSecretKey());
        const sub = String(res.payload.sub || "");
        if (!sub) return null;
        return { userId: sub };
    } catch {
        return null;
    }
}

async function issueSession(userId: string) {
    const prisma = getPrisma();

    const accessToken = await signAccessToken(userId);
    const refreshToken = randomBytes(32).toString("hex");
    const tokenHash = hashRefreshToken(refreshToken);

    const expiresAt = new Date(Date.now() + REFRESH_TTL_SEC * 1000);

    await prisma.session.create({
        data: {
            userId,
            tokenHash,
            expiresAt,
        },
    });

    return {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: ACCESS_TTL_SEC,
    };
}

async function refreshSession(refreshToken: string) {
    const prisma = getPrisma();
    const tokenHash = hashRefreshToken(refreshToken);

    const session = await prisma.session.findUnique({ where: { tokenHash } });
    if (!session) return null;
    if (session.revokedAt) return null;
    if (session.expiresAt.getTime() <= Date.now()) return null;

    const newExpiresAt = new Date(Date.now() + REFRESH_TTL_SEC * 1000);

    await prisma.session.update({
        where: { id: session.id },
        data: {
            expiresAt: newExpiresAt,
            lastUsedAt: new Date(),
        },
    });

    const newAccess = await signAccessToken(session.userId);

    return {
        access_token: newAccess,
        refresh_token: refreshToken,
        expires_in: ACCESS_TTL_SEC,
        userId: session.userId,
    };
}

export async function isDisplayNameTaken(displayName: string, exceptUserId?: string) {
    const found = await getPrisma().user.findFirst({
        where: { displayName, ...(exceptUserId ? { NOT: { id: exceptUserId } } : {}) },
        select: { id: true },
    });
    return Boolean(found);
}

export async function registerUser(input: {
    email: string;
    password: string;
    displayName: string;
}) {
    const email = String(input.email || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "");
    const displayName = String(input.displayName || "").trim();
    const password = String(input.password || "");

    if (!email || !email.includes("@"))
        throw errorWithStatus("Invalid email", 400);
    if (displayName.length < 2) throw errorWithStatus("Name is too short", 400);
    if (displayName.length > 100) throw errorWithStatus("Name is too long", 400);
    if (email.length > 255) throw errorWithStatus("Invalid email", 400);
    if (password.length > 200) throw errorWithStatus("Password is too long", 400);
    if (password.length < 6)
        throw errorWithStatus("Password must be at least 6 characters", 400);

    const prisma = getPrisma();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw errorWithStatus("Email already in use", 400);
    if (await isDisplayNameTaken(displayName)) throw errorWithStatus("That username is already taken", 400);

    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.hash(password, 10);

    const config = useRuntimeConfig();
    const allowAdminSignup = Boolean((config as any).allowAdminSignup);

    let role: any = "user";
    if (allowAdminSignup && process.env.NODE_ENV !== "production") {
        const cnt = await prisma.user.count();
        if (cnt === 0) role = "admin";
    }

    const user = await prisma.user.create({
        data: {
            email,
            passwordHash,
            displayName,
            role,
        },
    });

    const session = await issueSession(user.id);
    return { user: toPublicUser(user), session };
}

export async function loginUser(input: { email: string; password: string }) {
    const email = String(input.email || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "");
    const password = String(input.password || "");
    if (!email || !password) throw errorWithStatus("Invalid credentials", 400);

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw errorWithStatus("Invalid credentials", 400);

    const bcrypt = await import("bcryptjs");
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw errorWithStatus("Invalid credentials", 400);

    await prisma.user.update({
        where: { id: user.id },
        data: { lastSignInAt: new Date() },
    });

    const session = await issueSession(user.id);
    return { user: toPublicUser(user), session };
}

export function createSession(event: H3Event, session: any | null) {
    if (!session?.access_token || !session?.refresh_token) return;

    setCookie(event, ACCESS_COOKIE, String(session.access_token), {
        ...cookieOpts(),
        maxAge:
            typeof session.expires_in === "number"
                ? session.expires_in
                : ACCESS_TTL_SEC,
    });

    setCookie(event, REFRESH_COOKIE, String(session.refresh_token), {
        ...cookieOpts(),
        maxAge: REFRESH_TTL_SEC,
    });
}

export async function revokeCurrentSession(event: H3Event) {
    const refreshToken = getCookie(event, REFRESH_COOKIE);
    if (!refreshToken) return;
    await getPrisma().session.updateMany({
        where: { tokenHash: hashRefreshToken(String(refreshToken)), revokedAt: null },
        data: { revokedAt: new Date() },
    });
}

export async function revokeOtherSessions(event: H3Event, userId: string) {
    const refreshToken = getCookie(event, REFRESH_COOKIE);
    const keepHash = refreshToken ? hashRefreshToken(String(refreshToken)) : "";
    await getPrisma().session.updateMany({
        where: { userId, revokedAt: null, NOT: { tokenHash: keepHash } },
        data: { revokedAt: new Date() },
    });
}

export async function countOtherSessions(event: H3Event, userId: string) {
    const refreshToken = getCookie(event, REFRESH_COOKIE);
    const keepHash = refreshToken ? hashRefreshToken(String(refreshToken)) : "";
    return getPrisma().session.count({
        where: { userId, revokedAt: null, expiresAt: { gt: new Date() }, NOT: { tokenHash: keepHash } },
    });
}

export function clearAuthSession(event: H3Event) {
    deleteCookie(event, ACCESS_COOKIE, { path: "/" });
    deleteCookie(event, REFRESH_COOKIE, { path: "/" });
}

export async function getSessionUser(
    event: H3Event,
): Promise<PublicUser | null> {
    const prisma = getPrisma();

    const accessToken = getCookie(event, ACCESS_COOKIE);
    if (accessToken) {
        const verified = await verifyAccessToken(String(accessToken));
        if (verified?.userId) {
            const user = await prisma.user.findUnique({
                where: { id: verified.userId },
            });
            return user ? toPublicUser(user) : null;
        }
    }

    const refreshToken = getCookie(event, REFRESH_COOKIE);
    if (!refreshToken) return null;

    const refreshed = await refreshSession(String(refreshToken));
    if (!refreshed?.userId) return null;

    createSession(event, refreshed);

    const user = await prisma.user.findUnique({
        where: { id: refreshed.userId },
    });
    return user ? toPublicUser(user) : null;
}

export async function requireUser(event: H3Event): Promise<PublicUser> {
    const user = await getSessionUser(event);
    if (!user?.id) throw errorWithStatus("Unauthorized", 401);
    return user;
}

export async function requireAdmin(event: H3Event): Promise<PublicUser> {
    const user = await requireUser(event);
    if (user.role !== "admin") throw errorWithStatus("Forbidden", 403);
    return user;
}
