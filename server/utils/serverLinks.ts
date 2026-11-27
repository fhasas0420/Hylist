import { createHash } from "node:crypto";

export function normalizeUrl(input: unknown, label: string): string | null {
    const raw = String(input ?? "").trim();
    if (!raw) return null;
    if (raw.length > 255) throw new Error(`${label} is too long`);
    let url: URL;
    try {
        url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    } catch {
        throw new Error(`${label} is not a valid link`);
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error(`${label} must start with http:// or https://`);
    if (url.username || url.password) throw new Error(`${label} must not contain a login`);
    return url.toString();
}

export const LINK_FIELDS = [
    { key: "discordUrl", label: "Discord link", hosts: ["discord.gg", "discord.com"] },
    { key: "websiteUrl", label: "Website", hosts: [] },
    { key: "storeUrl", label: "Store link", hosts: [] },
    { key: "youtubeUrl", label: "YouTube link", hosts: ["youtube.com", "youtu.be"] },
    { key: "tiktokUrl", label: "TikTok link", hosts: ["tiktok.com"] },
    { key: "twitterUrl", label: "X link", hosts: ["x.com", "twitter.com"] },
    { key: "instagramUrl", label: "Instagram link", hosts: ["instagram.com"] },
] as const;

export type LinkKey = (typeof LINK_FIELDS)[number]["key"];
export type ServerLinks = Partial<Record<LinkKey, string | null>>;

export function normalizeLinks(body: any): ServerLinks {
    const out: ServerLinks = {};
    for (const f of LINK_FIELDS) {
        if (body?.[f.key] === undefined) continue;
        const url = normalizeUrl(body[f.key], f.label);
        if (url && f.hosts.length) {
            const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
            if (!f.hosts.some((h) => host === h || host.endsWith(`.${h}`))) throw new Error(`${f.label} must be on ${f.hosts.join(" or ")}`);
        }
        out[f.key] = url && f.hosts.length ? url.replace(/^http:/, "https:") : url;
    }
    return out;
}

export function linksOf(row: Record<string, any>): Record<LinkKey, string> {
    return Object.fromEntries(LINK_FIELDS.map((f) => [f.key, row[f.key] ?? ""])) as Record<LinkKey, string>;
}

export function verifyCode(token: string): string {
    return `hylist-verify=${createHash("sha256").update(`verify:${token}`).digest("hex").slice(0, 32)}`;
}
