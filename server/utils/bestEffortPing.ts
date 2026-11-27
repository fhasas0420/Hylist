import { resolveGameSrvTarget } from "./resolveSrvTarget";
import { tcpPing } from "./tcpPing";

export const HYTALE_DEFAULT_PORT = 5520;

export type BestEffortPingResult = {
    online: boolean;
    pingMs: number | null;
    targetHost: string;
    targetPort: number;
    method: "tcp" | "srv+tcp";
};

export async function bestEffortPing(
    host: string,
    port: number,
): Promise<BestEffortPingResult> {
    const cleanedHost = String(host || "")
        .trim()
        .replace(/\.$/, "");
    const cleanedPort = Number(port);

    if (!cleanedHost || !Number.isFinite(cleanedPort)) {
        return { online: false, pingMs: null, targetHost: cleanedHost, targetPort: cleanedPort, method: "tcp" };
    }

    if (cleanedPort === HYTALE_DEFAULT_PORT) {
        const srv = await resolveGameSrvTarget(cleanedHost);
        if (srv) {
            const res = await tcpPing(srv.host, srv.port);
            return { online: res.online, pingMs: res.pingMs, targetHost: srv.host, targetPort: srv.port, method: "srv+tcp" };
        }
    }

    const res = await tcpPing(cleanedHost, cleanedPort);
    return { online: res.online, pingMs: res.pingMs, targetHost: cleanedHost, targetPort: cleanedPort, method: "tcp" };
}
