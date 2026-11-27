export function tagsToJson(tags: string[]): string {
    return JSON.stringify(Array.isArray(tags) ? tags : []);
}

export function tagsFromJson(value: unknown): string[] {
    if (Array.isArray(value)) {
        return value.map((t) => String(t)).filter(Boolean);
    }

    const raw = String(value ?? "").trim();
    if (!raw) return [];

    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed))
            return parsed.map((t) => String(t)).filter(Boolean);
    } catch {
    }

    return [];
}
