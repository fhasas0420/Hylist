import net from "node:net";
import { lookup } from "node:dns/promises";

const blocked = new net.BlockList();
for (const [ip, prefix] of [
    ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
    ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.168.0.0", 16],
    ["198.18.0.0", 15], ["224.0.0.0", 4], ["240.0.0.0", 4],
] as const) blocked.addSubnet(ip, prefix, "ipv4");
for (const [ip, prefix] of [
    ["::", 128], ["::1", 128], ["fc00::", 7], ["fe80::", 10], ["ff00::", 8],
] as const) blocked.addSubnet(ip, prefix, "ipv6");

export function isPrivateIp(address: string): boolean {
    const mapped = address.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
    if (mapped) return blocked.check(mapped[1]!, "ipv4");
    const family = net.isIP(address);
    if (!family) return true;
    return blocked.check(address, family === 4 ? "ipv4" : "ipv6");
}

export async function isPublicHost(host: string): Promise<boolean> {
    try {
        const addrs = await lookup(host, { all: true });
        return addrs.length > 0 && addrs.every((a) => !isPrivateIp(a.address));
    } catch {
        return false;
    }
}

export async function assertPublicHost(host: string) {
    if (!(await isPublicHost(host)))
        throw new Error("Host must resolve to a public IP address");
}
