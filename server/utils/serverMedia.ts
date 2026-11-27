import path from "node:path";
import { rm } from "node:fs/promises";

export type ServerMediaKind = "logo" | "banner";

export const MEDIA_ROOT = path.join(process.cwd(), "public", "server-media");

export function inferImageExt(
    contentType: string | undefined | null,
    filename: string | undefined | null,
): string | null {
    const ct = String(contentType || "")
        .toLowerCase()
        .trim();
    if (ct === "image/png") return "png";
    if (ct === "image/jpeg" || ct === "image/jpg") return "jpg";
    if (ct === "image/webp") return "webp";
    if (ct === "image/gif") return "gif";

    const fn = String(filename || "");
    const m = fn.match(/\.([a-z0-9]+)$/i);
    const ext = m?.[1]?.toLowerCase();
    if (ext === "png" || ext === "jpg" || ext === "jpeg" || ext === "webp" || ext === "gif")
        return ext === "jpeg" ? "jpg" : ext;
    return null;
}

export function sniffImageExt(buf: Buffer): string | null {
    if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
    if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
    if (buf.length >= 6 && /^GIF8[79]a$/.test(buf.subarray(0, 6).toString("latin1"))) return "gif";
    if (buf.length >= 12 && buf.subarray(0, 4).toString("latin1") === "RIFF" && buf.subarray(8, 12).toString("latin1") === "WEBP") return "webp";
    return null;
}

export function validateServerMedia(kind: ServerMediaKind, bytes: number) {
    const max = kind === "logo" ? 1_500_000 : 4_000_000;
    if (bytes <= 0) throw new Error("Empty file");
    if (bytes > max)
        throw new Error(
            `${kind === "logo" ? "Logo" : "Banner"} is too large (max ${Math.round(max / 1_000_000)}MB)`,
        );
}

function resolveInside(dir: string, rel: string): string | null {
    const abs = path.resolve(dir, rel);
    return abs.startsWith(dir + path.sep) ? abs : null;
}

export async function removeMediaUrl(url: string | null | undefined, ownerDir: string) {
    const clean = String(url || "").split("?")[0] || "";
    if (!clean.startsWith("/server-media/")) return;
    const dir = resolveInside(MEDIA_ROOT, ownerDir);
    if (!dir) return;
    const abs = resolveInside(dir, clean.slice("/server-media/".length).replace(`${ownerDir}/`, ""));
    if (!abs) return;
    await rm(abs, { force: true }).catch(() => { });
}

export async function removeServerMediaDir(serverId: string) {
    const dir = resolveInside(MEDIA_ROOT, String(serverId));
    if (!dir || path.basename(dir) === "users") return;
    await rm(dir, { recursive: true, force: true }).catch(() => { });
}
