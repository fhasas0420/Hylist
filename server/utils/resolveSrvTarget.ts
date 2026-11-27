import { resolveSrv } from "node:dns/promises";

export type SrvTarget = { host: string; port: number };

function pickBest(
    records: Array<{
        priority: number;
        weight: number;
        port: number;
        name: string;
    }>,
): SrvTarget {
    const sorted = [...records].sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        return b.weight - a.weight;
    });

    const best = sorted[0]!;
    const host = best.name.replace(/\.$/, "");
    return { host, port: best.port };
}

async function trySrv(
    service: string,
    host: string,
): Promise<SrvTarget | null> {
    try {
        const records = await resolveSrv(`${service}.${host}`);
        if (!records || records.length === 0) return null;
        return pickBest(records as any);
    } catch {
        return null;
    }
}

export async function resolveGameSrvTarget(
    host: string,
): Promise<SrvTarget | null> {
    const cleaned = String(host || "")
        .trim()
        .replace(/\.$/, "");
    if (!cleaned) return null;
    return await trySrv("_hytale._tcp", cleaned);
}
