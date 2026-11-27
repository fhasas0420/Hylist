import { PrismaClient } from "@prisma/client";

function ensureDatabaseUrl() {
    const url = process.env.DATABASE_URL || "";
    if (!url) {
        throw new Error("Missing DATABASE_URL (MySQL connection string)");
    }
    return url;
}

declare global {
    var __prisma: PrismaClient | undefined;
}

export function getPrisma(): PrismaClient {
    ensureDatabaseUrl();
    if (!globalThis.__prisma) {
        globalThis.__prisma = new PrismaClient();
    }

    return globalThis.__prisma;
}
