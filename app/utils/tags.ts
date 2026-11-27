export const TAGS = [
    "Adventure",
    "Anarchy",
    "Creative",
    "Factions",
    "Hardcore",
    "MiniGames",
    "MMORPG",
    "Modded",
    "PvE",
    "PvP",
    "Roleplay",
    "Skyblock",
    "Survival",
    "SMP",
    "Towny",
    "Vanilla",
] as const;

export function canonicalTag(input: any): string | null {
    const s = String(input || "").trim();
    if (!s) return null;
    const found = (TAGS as readonly string[]).find(
        (t) => t.toLowerCase() === s.toLowerCase(),
    );
    return found ?? null;
}

export function formatTag(input: any): string {
    const s = String(input || "").trim();
    if (!s) return "";
    const can = canonicalTag(s);
    if (can) return can;
    return s.charAt(0).toUpperCase() + s.slice(1);
}