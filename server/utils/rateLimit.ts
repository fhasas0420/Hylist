type Bucket = { count: number; resetAt: number };
const g = globalThis as any;
const buckets: Map<string, Bucket> = (g.__hylistRateLimit ??= new Map());

export function hitRateLimit(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const b = buckets.get(key);
    if (!b || b.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        if (buckets.size > 10000) for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
        return true;
    }
    b.count++;
    return b.count <= limit;
}

export function resetRateLimit(key: string) {
    buckets.delete(key);
}
