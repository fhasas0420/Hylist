import { createHmac } from "node:crypto";
import { isPublicHost } from "./publicHost";

export type VoteWebhookPayload = {
    event: "vote" | "test";
    serverId: string;
    serverName: string;
    playerName: string | null;
    votedAt: string;
};

export type VoteWebhookResult = { ok: boolean; status?: number; error?: string };

export async function sendVoteWebhook(url: string, token: string, payload: VoteWebhookPayload): Promise<VoteWebhookResult> {
    let host: string;
    try {
        host = new URL(url).hostname.replace(/^\[|\]$/g, "");
    } catch {
        return { ok: false, error: "Invalid URL" };
    }
    if (!(await isPublicHost(host))) return { ok: false, error: "URL must point to a public address" };

    const body = JSON.stringify(payload);
    const signature = createHmac("sha256", token).update(body).digest("hex");
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "content-type": "application/json", "user-agent": "HyList-Votes/1.0", "x-hylist-signature": `sha256=${signature}` },
            body,
            redirect: "manual",
            signal: AbortSignal.timeout(5000),
        });
        return { ok: res.ok, status: res.status, error: res.ok ? undefined : `Endpoint answered HTTP ${res.status}` };
    } catch (e: any) {
        return { ok: false, error: e?.name === "TimeoutError" ? "Timed out after 5 s" : "Could not connect" };
    }
}
