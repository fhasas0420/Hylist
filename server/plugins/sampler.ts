import { getPrisma } from "../utils/prisma";
import { getPublicServers } from "../utils/publicServers";

const EVERY_MS = 5 * 60 * 1000;
const KEEP_MS = 8 * 24 * 60 * 60 * 1000;

async function takeSample() {
    const prisma = getPrisma();
    const last = await prisma.serverSample.findFirst({ orderBy: { at: "desc" }, select: { at: true } });
    if (last && Date.now() - last.at.getTime() < EVERY_MS - 30_000) return;

    const servers = await getPublicServers();
    if (servers.length) {
        await prisma.serverSample.createMany({
            data: servers.map((s) => ({ serverId: s.id, online: s.online, players: s.online && typeof s.players === "number" ? s.players : null })),
        });
    }
    await prisma.serverSample.deleteMany({ where: { at: { lt: new Date(Date.now() - KEEP_MS) } } });
}

export default defineNitroPlugin(() => {
    const g = globalThis as any;
    if (g.__hylistSampler) clearInterval(g.__hylistSampler);
    const run = () => takeSample().catch((e) => console.error("[sampler]", e?.message || e));
    setTimeout(run, 15_000);
    g.__hylistSampler = setInterval(run, EVERY_MS);
});
