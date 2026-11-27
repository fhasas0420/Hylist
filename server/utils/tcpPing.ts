import net from "node:net";
import { isPublicHost } from "./publicHost";

export type PingResult = {
    online: boolean;
    pingMs: number | null;
};

export async function tcpPing(
    host: string,
    port: number,
    timeoutMs = 1200,
): Promise<PingResult> {
    if (!(await isPublicHost(host))) return { online: false, pingMs: null };
    const start = Date.now();

    return await new Promise<PingResult>((resolve) => {
        const socket = net.connect({ host, port });

        const done = (online: boolean) => {
            socket.removeAllListeners();
            try {
                socket.destroy();
            } catch {
            }
            resolve({ online, pingMs: online ? Date.now() - start : null });
        };

        socket.setTimeout(timeoutMs);

        socket.on("connect", () => done(true));
        socket.on("timeout", () => done(false));
        socket.on("error", () => done(false));
    });
}
