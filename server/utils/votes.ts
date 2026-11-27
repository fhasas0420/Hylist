import type { H3Event } from "h3";
import { getRequestIP } from "h3";
import { createHash } from "node:crypto";
import { getPrisma } from "./prisma";

export const VOTE_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export type VoteCounts = { month: number; total: number };

export function monthStart(now = new Date()): Date {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export function voterIpHash(event: H3Event): string {
    const ip = getRequestIP(event, { xForwardedFor: true }) || "unknown";
    const salt = process.env.AUTH_REFRESH_PEPPER || "hylist";
    return createHash("sha256").update(`${salt}:vote:${ip}`).digest("hex");
}

export async function getVoteCounts(serverIds?: string[]): Promise<Record<string, VoteCounts>> {
    const prisma = getPrisma();
    const where = serverIds ? { serverId: { in: serverIds } } : {};
    const [total, month] = await Promise.all([
        prisma.vote.groupBy({ by: ["serverId"], where, _count: { _all: true } }),
        prisma.vote.groupBy({ by: ["serverId"], where: { ...where, createdAt: { gte: monthStart() } }, _count: { _all: true } }),
    ]);
    const out: Record<string, VoteCounts> = {};
    for (const r of total) out[r.serverId] = { month: 0, total: r._count._all };
    for (const r of month) (out[r.serverId] ??= { month: 0, total: 0 }).month = r._count._all;
    return out;
}

export async function nextVoteAt(serverId: string, userId: string, ipHash: string): Promise<number | null> {
    const since = new Date(Date.now() - VOTE_COOLDOWN_MS);
    const last = await getPrisma().vote.findFirst({
        where: { serverId, createdAt: { gt: since }, OR: [{ userId }, { ipHash }] },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
    });
    return last ? last.createdAt.getTime() + VOTE_COOLDOWN_MS : null;
}
