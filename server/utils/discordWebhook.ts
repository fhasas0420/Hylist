
type AddedServer = {
    id: string;
    name: string;
    ip: string;
    country: string;
    tags: string[];
    description?: string | null;
};

function siteUrl(): string | null {
    const url = String(process.env.SITE_URL || useRuntimeConfig().public?.siteUrl || "").replace(/\/+$/, "");
    if (!/^https?:\/\//.test(url) || /\/\/(localhost|127\.|0\.0\.0\.0)/.test(url)) return null;
    return url;
}

export async function notifyServerAdded(server: AddedServer, addedBy: string) {
    const webhookUrl = String(process.env.DISCORD_WEBHOOK_URL || useRuntimeConfig().discordWebhookUrl || "").trim();
    if (!webhookUrl) return;

    const base = siteUrl();
    const embed: Record<string, any> = {
        title: `🆕 ${server.name}`.slice(0, 256),
        color: 0x10b981,
        fields: [
            { name: "IP", value: `\`${server.ip}\``, inline: true },
            { name: "Country", value: server.country || "Unknown", inline: true },
            { name: "Tags", value: server.tags.length ? server.tags.join(", ").slice(0, 1024) : "—", inline: false },
            { name: "Added by", value: addedBy.slice(0, 100) || "—", inline: true },
        ],
        timestamp: new Date().toISOString(),
    };
    if (server.description) embed.description = server.description.slice(0, 300);
    if (base) embed.url = `${base}/find?query=${encodeURIComponent(server.name)}`;

    try {
        const res = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: "HyList", embeds: [embed], allowed_mentions: { parse: [] } }),
            signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) console.error(`[discord] webhook HTTP ${res.status}`);
    } catch (err: any) {
        console.error("[discord] webhook failed:", err?.message || err);
    }
}
