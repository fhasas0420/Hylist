import { setHeader } from "h3";
import { getPublicServers } from "../../utils/publicServers";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export default defineEventHandler(async (event) => {
    const id = String(event.context.params?.file || "").replace(/\.svg$/i, "");
    const servers = await getPublicServers();
    const index = servers.findIndex((s) => s.id === id);
    const s = servers[index];

    setHeader(event, "content-type", "image/svg+xml; charset=utf-8");
    setHeader(event, "cache-control", "public, max-age=300");

    if (!s) {
        setHeader(event, "cache-control", "public, max-age=60");
        return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="64" viewBox="0 0 320 64"><rect width="320" height="64" rx="10" fill="#131d2a"/><text x="16" y="38" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="14" fill="#8696a8">Server not found on HyList</text></svg>`;
    }

    const name = s.name.length > 26 ? `${s.name.slice(0, 25)}…` : s.name;
    const status = s.online ? (typeof s.players === "number" ? `${s.players}${typeof s.capacity === "number" ? `/${s.capacity}` : ""} online` : "Online") : "Offline";
    const font = "Inter,Segoe UI,Arial,sans-serif";

    return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="64" viewBox="0 0 320 64" role="img" aria-label="${esc(`${s.name} on HyList: ${status}, ${s.votesMonth} votes this month`)}">
<rect x="0.5" y="0.5" width="319" height="63" rx="10" fill="#131d2a" stroke="#23324a"/>
<text x="16" y="26" font-family="${font}" font-size="15" font-weight="700" fill="#dfe6ee">${esc(name)}</text>
<circle cx="20" cy="43" r="3.5" fill="${s.online ? "#4fd1a5" : "#5d6b7c"}"/>
<text x="29" y="47" font-family="${font}" font-size="12" fill="${s.online ? "#4fd1a5" : "#8696a8"}">${esc(status)}</text>
<text x="304" y="26" text-anchor="end" font-family="${font}" font-size="15" font-weight="700" fill="#3fb8af">#${index + 1}</text>
<text x="304" y="47" text-anchor="end" font-family="${font}" font-size="12" fill="#8696a8">${s.votesMonth} votes · HyList</text>
</svg>`;
});
