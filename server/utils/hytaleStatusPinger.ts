import { isPublicHost } from "./publicHost";

export type HytaleStatusResult = {
    status: "online" | "offline";
    players?: number;
    capacity?: number;
    pingMs?: number;
};

type CacheEntry = { value: HytaleStatusResult; expiresAt: number };
const g = globalThis as any;
function cache(): Map<string, CacheEntry> {
    if (!g.__bombasHytaleStatusCache)
        g.__bombasHytaleStatusCache = new Map<string, CacheEntry>();
    return g.__bombasHytaleStatusCache;
}

const TTL_MS = 1000 * 30;

export async function pingViaHytaleStatus(
    hostname: string,
    port?: number,
): Promise<HytaleStatusResult> {
    const host = String(hostname || "").trim();
    if (!host || !(await isPublicHost(host))) return { status: "offline" };

    const p =
        typeof port === "number" && Number.isFinite(port) ? Math.trunc(port) : 5520;
    const key = `${host.toLowerCase()}:${p}`;
    const now = Date.now();
    const c = cache();
    const existing = c.get(key);
    if (existing && existing.expiresAt > now) return existing.value;

    let value: HytaleStatusResult = { status: "offline" };
    try {
        const { query } = await import("@hytaleone/query");
        const startedAt = Date.now();
        const info = await query(host, p, { timeout: 3000 });
        value = {
            status: "online",
            players: info.currentPlayers,
            capacity: info.maxPlayers,
            pingMs: Math.max(0, Date.now() - startedAt),
        };
    } catch {
    }

    c.set(key, { value, expiresAt: now + TTL_MS });
    return value;
}
