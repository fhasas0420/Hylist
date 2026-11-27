<template>
    <section class="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6">
        <NuxtLink to="/your-servers" class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><Icon name="heroicons-outline:arrow-left" class="h-4 w-4" />Your servers</NuxtLink>
        <div class="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div class="flex min-w-0 items-center gap-3">
                <div class="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-line-strong">
                    <img v-if="draft?.logoUrl" :src="draft.logoUrl" alt="" class="h-full w-full object-cover" />
                    <span v-else class="grid h-full w-full place-items-center font-semibold text-muted">{{ (server?.name?.trim()?.[0] || "S").toUpperCase() }}</span>
                </div>
                <div class="min-w-0">
                    <h1 class="truncate text-[26px] font-bold leading-tight tracking-tight">{{ server?.name || "…" }}</h1>
                    <p class="mt-0.5 flex items-center gap-2 text-sm text-muted">
                        <span class="font-mono">{{ server?.host }}<template v-if="server && server.port !== 5520">:{{ server.port }}</template></span>
                        <span v-if="server?.verifiedAt" class="inline-flex items-center gap-1 text-accent"><Icon name="heroicons-outline:check-badge" class="h-4 w-4" />Verified</span>
                    </p>
                </div>
            </div>

            <div class="flex items-center gap-2">
                <NuxtLink :to="`/server/${id}`" class="btn-ghost"><Icon name="heroicons-outline:eye" class="h-4 w-4" />View page</NuxtLink>
                <button type="button" class="btn-ghost text-danger" :disabled="deleting || saving || pending" @click="onDelete"><Icon name="heroicons-outline:trash" class="h-4 w-4" />Delete</button>
                <button v-if="editableTab" class="btn-primary" type="button" :disabled="saving || pending" @click="save"><Icon name="heroicons-outline:check" class="h-4 w-4" />{{ saving ? "Saving…" : "Save changes" }}</button>
            </div>
        </div>

        <nav class="mt-6 flex gap-6 no-scrollbar overflow-x-auto border-b border-line">
            <button v-for="t in TABS" :key="t.id" type="button" class="inline-flex shrink-0 cursor-pointer items-center gap-1.5 border-b-2 py-3 text-sm font-medium transition-colors" :class="tab === t.id ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink'" @click="setTab(t.id)">
                <Icon :name="t.icon" class="h-4 w-4" />{{ t.label }}
            </button>
        </nav>

        <div v-if="pending" class="panel mt-6 p-6 text-muted">Loading…</div>
        <div v-else-if="loadError" class="panel mt-6 p-6 text-danger">{{ loadError }}</div>

        <template v-else-if="draft">
            <div v-if="saveError" class="mt-6 rounded-[10px] border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{{ saveError }}</div>

            <div v-if="tab === 'details'" class="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
                <div class="space-y-6">
                    <div class="panel p-6">
                        <h2 class="text-[15px] font-semibold">General</h2>
                        <div class="mt-4 grid gap-4">
                            <div>
                                <label class="label" for="ed-name">Server name</label>
                                <input id="ed-name" v-model="draft.name" type="text" maxlength="56" class="field mt-1.5" />
                            </div>
                            <div>
                                <label class="label" for="ed-desc">Description</label>
                                <textarea id="ed-desc" v-model="draft.description" rows="6" maxlength="2000" class="field mt-1.5 resize-y" placeholder="Game modes, rules, community, events…" />
                                <p class="mt-1 text-right text-xs text-dim">{{ draft.description.length }}/2000</p>
                            </div>
                        </div>
                    </div>

                    <div class="panel p-6">
                        <h2 class="text-[15px] font-semibold">Connection</h2>
                        <div class="mt-4 grid gap-3 sm:grid-cols-[1fr_140px]">
                            <div>
                                <label class="label" for="ed-host">Address</label>
                                <input id="ed-host" v-model="draft.host" type="text" class="field mt-1.5 font-mono" />
                            </div>
                            <div>
                                <label class="label" for="ed-port">Port</label>
                                <input id="ed-port" v-model.number="draft.port" type="number" min="1" max="65535" class="field mt-1.5 font-mono" />
                            </div>
                        </div>
                        <p v-if="server?.verifiedAt" class="mt-3 text-xs text-dim">Changing the address removes the Verified badge until you verify again.</p>
                    </div>

                    <div class="panel p-6">
                        <h2 class="text-[15px] font-semibold">Tags &amp; location</h2>
                        <p class="label mt-4 flex justify-between"><span>Tags</span><span>{{ draft.tags.length }}/8</span></p>
                        <div class="mt-2 flex flex-wrap gap-1.5">
                            <button v-for="t in TAGS" :key="t" type="button" class="chip" :class="draft.tags.includes(t) && 'chip-on'" @click="toggleTag(t)">{{ t }}</button>
                        </div>
                        <label class="label mt-5 block" for="ed-country">Country</label>
                        <select id="ed-country" v-model="draft.country" class="field mt-1.5 sm:w-72">
                            <option value="" disabled>Select a country</option>
                            <option v-for="c in COUNTRIES" :key="c" :value="c">{{ c }}</option>
                        </select>
                    </div>
                </div>

                <div class="panel h-fit p-6">
                    <h2 class="text-[15px] font-semibold">Banner &amp; logo</h2>
                    <p class="mt-1 text-sm text-muted">Shown on your card and server page. PNG, JPG, WebP or GIF.</p>

                    <div class="relative mt-4">
                        <div class="h-28 overflow-hidden rounded-lg ring-1 ring-line-strong">
                            <img v-if="draft.bannerUrl" :src="draft.bannerUrl" alt="" class="h-full w-full object-cover" />
                            <div v-else class="banner-empty h-full w-full" />
                        </div>
                        <div class="absolute -bottom-6 left-3 h-14 w-14 overflow-hidden rounded-xl border-4 border-surface bg-line-strong">
                            <img v-if="draft.logoUrl" :src="draft.logoUrl" alt="" class="h-full w-full object-cover" />
                            <span v-else class="grid h-full w-full place-items-center font-semibold text-muted">{{ (draft.name?.trim()?.[0] || "S").toUpperCase() }}</span>
                        </div>
                    </div>

                    <input ref="bannerInput" type="file" accept="image/png,image/jpeg,image/webp,image/gif" class="sr-only" :disabled="uploadingBanner" @change="onPickBanner" />
                    <input ref="logoInput" type="file" accept="image/png,image/jpeg,image/webp,image/gif" class="sr-only" :disabled="uploadingLogo" @change="onPickLogo" />

                    <div class="mt-10 space-y-3 text-sm">
                        <div class="flex items-center justify-between gap-2">
                            <div><p>Banner</p><p class="text-xs text-dim">Wide image, max ~4 MB</p></div>
                            <div class="flex gap-2">
                                <button type="button" class="btn-ghost px-3 py-1.5 text-xs" :disabled="uploadingBanner" @click="bannerInput?.click()">{{ uploadingBanner ? "Uploading…" : draft.bannerUrl ? "Change" : "Upload" }}</button>
                                <button v-if="draft.bannerUrl" type="button" class="btn-ghost px-3 py-1.5 text-xs text-muted" :disabled="saving || uploadingBanner" @click="removeMedia('banner')">Remove</button>
                            </div>
                        </div>
                        <div class="flex items-center justify-between gap-2 border-t border-line pt-3">
                            <div><p>Logo</p><p class="text-xs text-dim">Square, max ~1.5 MB</p></div>
                            <div class="flex gap-2">
                                <button type="button" class="btn-ghost px-3 py-1.5 text-xs" :disabled="uploadingLogo" @click="logoInput?.click()">{{ uploadingLogo ? "Uploading…" : draft.logoUrl ? "Change" : "Upload" }}</button>
                                <button v-if="draft.logoUrl" type="button" class="btn-ghost px-3 py-1.5 text-xs text-muted" :disabled="saving || uploadingLogo" @click="removeMedia('logo')">Remove</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-else-if="tab === 'links'" class="panel mt-6 p-6">
                <h2 class="text-[15px] font-semibold">Links</h2>
                <p class="mt-1 text-sm text-muted">Shown as buttons on your server page. All optional. Leave a field empty to hide it.</p>
                <div class="mt-5 grid gap-4 md:grid-cols-2">
                    <div v-for="l in SERVER_LINKS" :key="l.key">
                        <label class="label flex items-center gap-1.5" :for="`ed-${l.key}`"><Icon :name="l.icon" class="h-4 w-4" />{{ l.label }}</label>
                        <input :id="`ed-${l.key}`" v-model="draft.links[l.key]" type="url" class="field mt-1.5" :placeholder="l.placeholder" />
                    </div>
                </div>
            </div>

            <div v-else-if="tab === 'rewards'" class="panel mt-6 p-6">
                <h2 class="text-[15px] font-semibold">Vote rewards</h2>
                <p class="mt-1 text-sm text-muted">
                    On every vote HyList sends a <code class="text-ink">POST</code> to this URL, so your server can give the player an in-game reward.
                    Voters are asked for their Hytale username when this is set.
                </p>
                <div class="mt-4 flex flex-col gap-2 sm:flex-row">
                    <input v-model="draft.voteWebhookUrl" type="url" class="field" placeholder="https://play.example.com/hylist/vote" />
                    <button type="button" class="btn-ghost shrink-0" :disabled="testingWebhook || !server?.voteWebhookUrl || draft.voteWebhookUrl !== server?.voteWebhookUrl" :title="draft.voteWebhookUrl !== server?.voteWebhookUrl ? 'Save first' : ''" @click="testWebhook">
                        <Icon name="heroicons-outline:paper-airplane" class="h-4 w-4" />{{ testingWebhook ? "Sending…" : "Send test" }}
                    </button>
                </div>
                <p v-if="webhookResult" class="mt-2 text-sm" :class="webhookResult.ok ? 'text-online' : 'text-danger'">{{ webhookResult.ok ? `Delivered (HTTP ${webhookResult.status})` : webhookResult.error }}</p>
                <p class="label mt-6">Request format</p>
                <pre class="mt-2 overflow-auto rounded-lg bg-field p-3 text-xs text-muted ring-1 ring-line-strong">POST {{ draft.voteWebhookUrl || "https://your-url" }}
Content-Type: application/json
X-HyList-Signature: sha256=&lt;HMAC-SHA256 of the body, key = your heartbeat token&gt;

{ "event": "vote", "serverId": "{{ id }}", "serverName": "…",
  "playerName": "Steve" | null, "votedAt": "2026-11-27T12:00:00.000Z" }</pre>
                <p class="mt-2 text-xs text-dim">Check the signature before giving rewards, so nobody can fake votes. <code>playerName</code> is null when the voter left it empty. Test requests have <code>"event": "test"</code>.</p>
            </div>

            <div v-else-if="tab === 'status'" class="mt-6 grid gap-6 lg:grid-cols-2">
                <div class="panel p-6">
                    <h2 class="text-[15px] font-semibold">Live status (heartbeat)</h2>
                    <p class="mt-1 text-sm text-muted">Send a <code class="text-ink">POST /api/servers/heartbeat</code> every minute from your server to show it as online with the player count. Keep this token private.</p>
                    <div class="mt-4 flex items-center gap-2">
                        <code class="min-w-0 flex-1 truncate rounded-lg bg-field px-4 py-3 text-xs text-ink ring-1 ring-line-strong">{{ draft.verificationToken }}</code>
                        <button type="button" class="btn-ghost shrink-0" @click="copyToken"><Icon name="heroicons-outline:clipboard-document" class="h-4 w-4" />{{ tokenCopied ? "Copied" : "Copy" }}</button>
                    </div>
                    <pre class="mt-3 overflow-auto rounded-lg bg-field p-3 text-xs text-muted ring-1 ring-line-strong">{ "host": "{{ server?.host }}", "port": {{ server?.port }}, "token": "…", "players": 12, "capacity": 100 }</pre>
                </div>
                <div class="panel p-6">
                    <div class="flex items-center justify-between gap-3">
                        <h2 class="text-[15px] font-semibold">Verification</h2>
                        <span v-if="server?.verifiedAt" class="inline-flex items-center gap-1 text-sm font-medium text-accent"><Icon name="heroicons-outline:check-badge" class="h-4 w-4" />Verified</span>
                        <span v-else class="text-sm text-dim">Not verified</span>
                    </div>
                    <p v-if="server?.verifiedAt" class="mt-1 text-sm text-muted">Your server shows a Verified badge.</p>
                    <template v-else>
                        <p class="mt-1 text-sm text-muted">Prove you run this server to get a Verified badge. Either way works:</p>
                        <ol class="mt-3 space-y-3 text-sm text-muted">
                            <li><span class="font-medium text-ink">Heartbeat.</span> Send one heartbeat with your token. It verifies automatically.</li>
                            <li>
                                <span class="font-medium text-ink">DNS.</span> Add a TXT record on <span class="font-mono text-ink">{{ server?.host }}</span> with this value:
                                <button type="button" class="mt-2 block w-full cursor-pointer truncate rounded-lg bg-field px-3 py-2 text-left font-mono text-xs text-ink ring-1 ring-line-strong hover:ring-accent" title="Click to copy" @click="copyText(server?.verifyCode || '')">{{ server?.verifyCode }}</button>
                                <button type="button" class="btn-ghost mt-2 py-2" :disabled="verifying" @click="verifyDns"><Icon name="heroicons-outline:check-badge" class="h-4 w-4" />{{ verifying ? "Checking…" : "Check DNS" }}</button>
                            </li>
                        </ol>
                    </template>
                </div>
            </div>

            <div v-else class="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
                <div class="panel p-6">
                    <div class="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <h2 class="text-[15px] font-semibold">Stats</h2>
                            <p class="mt-1 text-sm text-muted">Page views and votes, last 30 days.</p>
                        </div>
                        <div class="flex gap-5 text-sm">
                            <span class="inline-flex items-center gap-1.5"><span class="h-2 w-2 rounded-sm bg-line-strong" />{{ stats?.totals.views ?? 0 }} views</span>
                            <span class="inline-flex items-center gap-1.5"><span class="h-2 w-2 rounded-sm bg-accent" />{{ stats?.totals.votes ?? 0 }} votes</span>
                        </div>
                    </div>
                    <div v-if="stats" class="mt-4">
                        <div class="flex h-32 items-end gap-[3px]">
                            <div v-for="d in stats.days" :key="d.day" class="group relative flex h-full flex-1 items-end gap-px" :title="`${d.day}: ${d.views} views, ${d.votes} votes`">
                                <div class="flex-1 rounded-t-sm bg-line-strong group-hover:bg-muted" :style="{ height: barHeight(d.views) }" />
                                <div class="flex-1 rounded-t-sm bg-accent group-hover:bg-accent-hover" :style="{ height: barHeight(d.votes) }" />
                            </div>
                        </div>
                        <div class="mt-1.5 flex justify-between font-mono text-[10px] text-dim"><span>{{ stats.days[0]?.day.slice(5) }}</span><span>today</span></div>
                        <div class="mt-6">
                            <p class="label">Latest votes</p>
                            <ul v-if="stats.recentVotes.length" class="mt-2 divide-y divide-line text-sm">
                                <li v-for="(v, i) in stats.recentVotes" :key="i" class="flex justify-between gap-3 py-2">
                                    <span class="truncate">{{ v.user }}<span v-if="v.playerName" class="ml-2 font-mono text-xs text-muted">{{ v.playerName }}</span></span>
                                    <span class="shrink-0 text-xs text-dim">{{ new Date(v.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) }}</span>
                                </li>
                            </ul>
                            <p v-else class="mt-2 text-sm text-dim">No votes yet.</p>
                        </div>
                    </div>
                </div>
                <BadgeEmbed :server-id="id" :server-name="server?.name || ''" />
            </div>
        </template>
    </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { TAGS } from "~/utils/tags";
import { COUNTRIES } from "~/utils/countries";
import { SERVER_LINKS, type ServerLinkKey } from "~/utils/serverLinks";

const TABS = [
    { id: "details", label: "Details", icon: "heroicons-outline:pencil-square" },
    { id: "links", label: "Links", icon: "heroicons-outline:link" },
    { id: "rewards", label: "Vote rewards", icon: "heroicons-outline:gift" },
    { id: "status", label: "Status & verification", icon: "heroicons-outline:signal" },
    { id: "stats", label: "Stats & badge", icon: "heroicons-outline:chart-bar" },
] as const;
type TabId = (typeof TABS)[number]["id"];

definePageMeta({ middleware: "auth" });
const route = useRoute();
const toast = useAppToast();
const requestFetch = useRequestFetch();
const { ask } = useConfirm();

const tab = computed<TabId>(() => (TABS.some((t) => t.id === route.query.tab) ? (route.query.tab as TabId) : "details"));
const editableTab = computed(() => ["details", "links", "rewards"].includes(tab.value));
function setTab(id: TabId) {
    navigateTo({ query: { ...route.query, tab: id === "details" ? undefined : id } }, { replace: true });
}

type MyServer = {
    id: string;
    name: string;
    description?: string;
    host: string;
    port: number;
    country: string;
    tags: string[];
    logoUrl?: string;
    bannerUrl?: string;
    verificationToken: string;
    verifyCode: string;
    verifiedAt: number | null;
    voteWebhookUrl: string;
} & Record<ServerLinkKey, string>;

type Stats = {
    days: { day: string; views: number; votes: number }[];
    totals: { views: number; votes: number };
    recentVotes: { at: number; playerName: string | null; user: string }[];
};

const id = computed(() => String(route.params.id || ""));
const pending = ref(true);
const loadError = ref<string | null>(null);
const saveError = ref<string | null>(null);
const saving = ref(false);
const deleting = ref(false);

const server = ref<MyServer | null>(null);

const serverName = computed(() => server.value?.name || "this server");
useHead(() => ({
    title: serverName.value
        ? `Edit Server ${serverName.value} — HyList`
        : "Edit Server — HyList",
}));
const draft = ref<{
    id: string;
    name: string;
    description: string;
    host: string;
    port: number;
    country: string;
    tags: string[];
    logoUrl?: string;
    bannerUrl?: string;
    verificationToken: string;
    links: Record<ServerLinkKey, string>;
    voteWebhookUrl: string;
} | null>(null);

const stats = ref<Stats | null>(null);
const statsMax = computed(() => Math.max(1, ...(stats.value?.days.flatMap((d) => [d.views, d.votes]) ?? [])));
const barHeight = (v: number) => (v ? `${Math.max(4, (v / statsMax.value) * 100)}%` : "0");
async function loadStats() {
    stats.value = await $fetch<Stats>(`/api/servers/${id.value}/stats`).catch(() => null);
}

async function copyText(text: string) {
    await navigator.clipboard.writeText(text).catch(() => null);
    toast.success("Copied");
}

const verifying = ref(false);
async function verifyDns() {
    verifying.value = true;
    try {
        await $fetch(`/api/servers/${id.value}/verify`, { method: "POST" });
        toast.success("Verified!");
        await load();
    } catch (e: any) {
        toast.error(e?.data?.message || "Verification failed");
    } finally {
        verifying.value = false;
    }
}

const testingWebhook = ref(false);
const webhookResult = ref<{ ok: boolean; status?: number; error?: string } | null>(null);
async function testWebhook() {
    testingWebhook.value = true;
    webhookResult.value = null;
    try {
        webhookResult.value = await $fetch(`/api/servers/${id.value}/vote-webhook-test`, { method: "POST" });
    } catch (e: any) {
        webhookResult.value = { ok: false, error: e?.data?.message || "Test failed" };
    } finally {
        testingWebhook.value = false;
    }
}

const tokenCopied = ref(false);
async function copyToken() {
    if (!draft.value?.verificationToken) return;
    await navigator.clipboard.writeText(draft.value.verificationToken).catch(() => null);
    tokenCopied.value = true;
    setTimeout(() => (tokenCopied.value = false), 2000);
}

const uploadingLogo = ref(false);
const uploadingBanner = ref(false);
const bannerInput = ref<HTMLInputElement | null>(null);
const logoInput = ref<HTMLInputElement | null>(null);
const bannerFilename = ref<string | null>(null);
const logoFilename = ref<string | null>(null);

async function uploadMedia(kind: "logo" | "banner", file: File) {
    const fd = new FormData();
    fd.set("kind", kind);
    fd.set("file", file);
    const res = await $fetch<{ ok: true; url: string }>(
        `/api/servers/${id.value}/media`,
        {
            method: "POST",
            body: fd,
        },
    );
    if (!draft.value) return;
    if (kind === "logo") draft.value.logoUrl = res.url;
    else draft.value.bannerUrl = res.url;
}

async function onPickLogo(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    uploadingLogo.value = true;
    try {
        await uploadMedia("logo", file);
        logoFilename.value = file.name;
        toast.success("Logo uploaded!");
    } catch (err: any) {
        toast.error("Failed to upload logo!");
    } finally {
        uploadingLogo.value = false;
        input.value = "";
    }
}

async function onPickBanner(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    uploadingBanner.value = true;
    try {
        await uploadMedia("banner", file);
        bannerFilename.value = file.name;
        toast.success("Banner uploaded!");
    } catch (err: any) {
        toast.error("Failed to upload banner!");
    } finally {
        uploadingBanner.value = false;
        input.value = "";
    }
}

async function removeMedia(kind: "logo" | "banner") {
    if (!draft.value) return;
    saving.value = true;
    try {
        await $fetch(`/api/servers/${id.value}`, {
            method: "PATCH",
            body: kind === "logo" ? { logoUrl: null } : { bannerUrl: null },
        });
        if (kind === "logo") draft.value.logoUrl = undefined;
        else draft.value.bannerUrl = undefined;
        if (kind === "logo") logoFilename.value = null;
        else bannerFilename.value = null;
        toast.success("Media removed!");
        await load();
    } catch (err: any) {
        toast.error("Failed to remove media!");
    } finally {
        saving.value = false;
    }
}

function toggleTag(t: string) {
    if (!draft.value) return;
    const idx = draft.value.tags.findIndex(
        (s) => String(s).toLowerCase() === String(t).toLowerCase(),
    );
    if (idx >= 0) {
        draft.value.tags.splice(idx, 1);
        return;
    }
    if (draft.value.tags.length >= 8) return;
    const match = TAGS.find((x) => x.toLowerCase() === String(t).toLowerCase());
    draft.value.tags.push(match ?? t);
}

async function load() {
    pending.value = true;
    loadError.value = null;
    try {
        const res = await requestFetch<{ server: MyServer }>(`/api/servers/${id.value}`);
        server.value = res.server;
        draft.value = {
            id: res.server.id,
            name: res.server.name,
            description: String(res.server.description ?? ""),
            host: res.server.host,
            port: res.server.port,
            country: res.server.country,
            tags: Array.isArray(res.server.tags)
                ? res.server.tags.map((st) => {
                    const s = String(st || "");
                    const match = TAGS.find((t) => t.toLowerCase() === s.toLowerCase());
                    return match ?? s;
                })
                : [],
            logoUrl: res.server.logoUrl,
            bannerUrl: res.server.bannerUrl,
            verificationToken: res.server.verificationToken,
            links: Object.fromEntries(SERVER_LINKS.map((l) => [l.key, res.server[l.key] || ""])) as Record<ServerLinkKey, string>,
            voteWebhookUrl: res.server.voteWebhookUrl || "",
        };
        bannerFilename.value = null;
        logoFilename.value = null;
    } catch (e: any) {
        loadError.value = e?.data?.message || e?.message || "Failed to load server";
        toast.error("Failed to load server information!");
    } finally {
        pending.value = false;
    }
}

function validate() {
    if (!draft.value) return "Missing form";
    if (draft.value.name.trim().length < 2) return "Server name is required";
    if (!draft.value.host.trim()) return "Server IP/host is required";
    const p = Number(draft.value.port);
    if (!Number.isFinite(p) || p < 1 || p > 65535) return "Invalid port";
    if (draft.value.description.trim().length < 1)
        return "Description is required";
    if (!draft.value.country.trim()) return "Server location is required";
    if (draft.value.tags.length === 0) return "Select at least one tag";
    return null;
}

async function save() {
    saveError.value = null;
    const e = validate();
    if (e) {
        saveError.value = e;
        return;
    }

    saving.value = true;
    try {
        await $fetch(`/api/servers/${id.value}`, {
            method: "PATCH",
            body: {
                name: draft.value!.name,
                description: draft.value!.description,
                host: draft.value!.host,
                port: draft.value!.port,
                country: draft.value!.country,
                tags: draft.value!.tags,
                ...draft.value!.links,
                voteWebhookUrl: draft.value!.voteWebhookUrl,
            },
        });
        toast.success("Server saved successfully!");
        await load();
    } catch (e: any) {
        saveError.value = e?.data?.message || e?.message || "Failed to save";
        toast.error("Failed to save server, please try again.");
    } finally {
        saving.value = false;
    }
}

async function onDelete() {
    const ok = await ask({ title: `Delete “${serverName.value}”?`, message: "The listing, its votes, reviews, logo and banner will be removed. This can't be undone.", confirmText: "Delete server", danger: true });
    if (!ok) return;
    deleting.value = true;
    try {
        await $fetch(`/api/servers/${id.value}`, { method: "DELETE" });
        toast.success("Server is deleted!");
        await navigateTo("/your-servers");
    } catch (e: any) {
        toast.error("Failed to delete server!");
    } finally {
        deleting.value = false;
    }
}

await load();
onMounted(loadStats);
</script>