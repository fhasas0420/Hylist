export type PublicServer = {
    id: string;
    name: string;
    description?: string;
    tags: string[];
    ip: string;
    country: string;
    isFeatured?: boolean;
    isSponsored?: boolean;
    verified?: boolean;
    voteRewards?: boolean;
    logoUrl?: string;
    bannerUrl?: string;
    online: boolean;
    status?: "online" | "offline";
    ping?: number;
    players?: number;
    capacity?: number;
    lastSeenAt?: number;
    votesMonth?: number;
    votesTotal?: number;
};

export function normalizeTags(tags: string[]): string[] {
    const out: string[] = [];
    const seen = new Set<string>();

    for (const raw of tags) {
        const t = String(raw || "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, " ");
        if (!t) continue;
        if (t.length > 24) continue;
        if (seen.has(t)) continue;
        seen.add(t);
        out.push(t);
        if (out.length >= 10) break;
    }

    return out;
}

export function normalizeHost(input: string) {
    const host = String(input || "").trim();
    if (!host) throw new Error("IP/host is required");
    if (host.length > 128) throw new Error("IP/host is too long");

    if (/^https?:\/\//i.test(host))
        throw new Error("Do not include http(s):// in IP/host");

    const cleaned = host.replace(/\/.*/g, "");

    if (!/^[a-z0-9.-]+$/i.test(cleaned))
        throw new Error("Invalid characters in IP/host");

    return cleaned;
}

export function normalizePort(input: any) {
    const port = Number(input ?? 5520);
    if (!Number.isFinite(port) || port < 1 || port > 65535)
        throw new Error("Invalid port");
    return Math.trunc(port);
}

export function normalizeCountry(input: string) {
    const country = String(input || "").trim();
    if (!country) return "Unknown";
    return country.slice(0, 56);
}

export function toDisplayIp(s: { host: string; port: number }) {
    return s.port && s.port !== 5520 ? `${s.host}:${s.port}` : s.host;
}
