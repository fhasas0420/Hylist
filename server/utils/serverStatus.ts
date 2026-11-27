import { pingViaHytaleStatus } from "./hytaleStatusPinger";
import { bestEffortPing } from "./bestEffortPing";

const OFFLINE_AFTER_MS = 1000 * 60 * 10;
const HEARTBEAT_FRESH_MS = 1000 * 60 * 2;

export type ServerStatus = {
    online: boolean;
    status: "online" | "offline";
    ping?: number;
    players?: number;
    capacity?: number;
    lastSeenAt?: number;
    heartbeatAt?: number;
};

type ServerRow = {
    host: string;
    port: number;
    lastSeenAt?: Date | null;
    heartbeatAt?: Date | null;
    heartbeatPlayers?: number | null;
    heartbeatCapacity?: number | null;
};

export async function getServerStatus(s: ServerRow, { active = true } = {}): Promise<ServerStatus> {
    const now = Date.now();
    const heartbeatAt = s.heartbeatAt ? new Date(s.heartbeatAt).getTime() : undefined;
    const heartbeatFresh = typeof heartbeatAt === "number" && now - heartbeatAt <= HEARTBEAT_FRESH_MS;

    let players: number | undefined;
    let capacity: number | undefined;
    let ping: number | undefined;
    let reachable = false;

    if (heartbeatFresh) {
        reachable = true;
        players = s.heartbeatPlayers ?? undefined;
        capacity = s.heartbeatCapacity ?? undefined;
    } else if (active) {
        const res = await pingViaHytaleStatus(String(s.host), Number(s.port));
        if (res.status === "online") {
            reachable = true;
            players = res.players;
            capacity = res.capacity;
            ping = res.pingMs;
        } else {
            const tcp = await bestEffortPing(String(s.host), Number(s.port));
            reachable = tcp.online;
            ping = typeof tcp.pingMs === "number" ? tcp.pingMs : undefined;
        }
    }

    const lastSeenDb = s.lastSeenAt ? new Date(s.lastSeenAt).getTime() : 0;
    const lastSeenAt = Math.max(lastSeenDb, heartbeatAt ?? 0) || undefined;
    const seenRecently = typeof lastSeenAt === "number" && now - lastSeenAt <= OFFLINE_AFTER_MS;
    const online = reachable || seenRecently;

    return { online, status: online ? "online" : "offline", ping, players, capacity, lastSeenAt, heartbeatAt };
}

export async function mapWithConcurrency<T, R>(items: T[], limit: number, mapper: (item: T) => Promise<R>): Promise<R[]> {
    const results: R[] = new Array(items.length);
    let i = 0;
    const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
        while (i < items.length) {
            const idx = i++;
            results[idx] = await mapper(items[idx]!);
        }
    });
    await Promise.all(workers);
    return results;
}
