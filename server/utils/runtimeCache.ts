type CacheEntry<T> = { value: T; expiresAt: number };

const g = globalThis as any;

function getMap(): Map<string, CacheEntry<any>> {
    if (!g.__bombasCache) g.__bombasCache = new Map<string, CacheEntry<any>>();
    return g.__bombasCache;
}

function getPending(): Map<string, Promise<any>> {
    if (!g.__bombasCachePending) g.__bombasCachePending = new Map<string, Promise<any>>();
    return g.__bombasCachePending;
}

export function getCached<T>(
    key: string,
    ttlMs: number,
    getter: () => Promise<T> | T,
): Promise<T> {
    const map = getMap();
    const now = Date.now();
    const existing = map.get(key);
    if (existing && existing.expiresAt > now)
        return Promise.resolve(existing.value as T);

    const pending = getPending();
    const inFlight = pending.get(key);
    if (inFlight) return inFlight as Promise<T>;

    const promise = Promise.resolve()
        .then(getter)
        .then((value) => {
            map.set(key, { value, expiresAt: Date.now() + ttlMs });
            return value;
        })
        .finally(() => pending.delete(key));
    pending.set(key, promise);
    return promise;
}

export function invalidateCache(keyPrefix: string) {
    const map = getMap();
    for (const key of map.keys()) {
        if (key === keyPrefix || key.startsWith(`${keyPrefix}:`)) {
            map.delete(key);
        }
    }
}
