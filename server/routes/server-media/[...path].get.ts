import { createError, setHeader } from "h3";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { MEDIA_ROOT as ROOT } from "../../utils/serverMedia";

const TYPES: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
};

export default defineEventHandler(async (event) => {
    const rel = String(event.context.params?.path || "");
    const abs = path.resolve(ROOT, rel);
    const type = TYPES[path.extname(abs).toLowerCase()];
    if (!abs.startsWith(ROOT + path.sep) || !type)
        throw createError({ statusCode: 404 });

    try {
        const data = await readFile(abs);
        setHeader(event, "Content-Type", type);
        setHeader(event, "X-Content-Type-Options", "nosniff");
        setHeader(event, "Cache-Control", "public, max-age=3600");
        return data;
    } catch {
        throw createError({ statusCode: 404 });
    }
});
