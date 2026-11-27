<template>
    <section class="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">
        <NuxtLink to="/" class="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><Icon name="heroicons-outline:arrow-left" class="h-4 w-4" />All servers</NuxtLink>

        <div v-if="error" class="panel mt-6 p-10 text-center">
            <p class="font-medium">{{ error.statusCode === 404 ? "This server doesn't exist or was removed." : "Couldn't load this server." }}</p>
            <NuxtLink to="/" class="btn-ghost mt-4">Back to the list</NuxtLink>
        </div>

        <template v-else-if="s">
            <div class="relative mt-4 h-40 overflow-hidden rounded-[10px] border border-line bg-raised sm:h-56">
                <img v-if="s.bannerUrl" :src="s.bannerUrl" alt="" class="h-full w-full object-cover" />
                <div v-else class="banner-empty h-full w-full" />
            </div>

            <div class="mt-5 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div class="flex min-w-0 items-center gap-4">
                    <div class="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-line-strong">
                        <img v-if="s.logoUrl" :src="s.logoUrl" alt="" class="h-full w-full object-cover" />
                        <span v-else class="grid h-full w-full place-items-center text-xl font-semibold text-muted">{{ (s.name?.trim()?.[0] || "S").toUpperCase() }}</span>
                    </div>
                    <div class="min-w-0">
                        <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <h1 class="truncate text-2xl font-bold tracking-tight sm:text-[28px]">{{ s.name }}</h1>
                            <span v-if="s.verified" class="inline-flex items-center gap-1 text-xs font-medium text-accent" title="The owner proved they run this server"><Icon name="heroicons-outline:check-badge" class="h-4 w-4" />Verified</span>
                            <span v-if="s.isSponsored" class="text-[11px] font-bold tracking-wider text-vip">VIP</span>
                            <span v-if="s.isFeatured" class="text-[11px] font-bold tracking-wider text-accent">FEATURED</span>
                        </div>
                        <p class="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                            <span class="inline-flex items-center gap-1.5" :class="s.online ? 'text-online' : ''"><span class="h-2 w-2 rounded-full" :class="s.online ? 'bg-online' : 'bg-dim'" />{{ s.online ? "Online" : "Offline" }}</span>
                            <span v-if="s.online && typeof s.players === 'number'" class="inline-flex items-center gap-1.5"><Icon name="heroicons-outline:users" class="h-4 w-4" />{{ s.players }}<template v-if="typeof s.capacity === 'number'"> / {{ s.capacity }}</template></span>
                            <span class="inline-flex items-center gap-1.5">
                                <img v-if="countryFlagUrl(s.country)" :src="countryFlagUrl(s.country)" alt="" class="h-3 w-[18px] rounded-[2px] object-cover" />
                                {{ s.country || "Unknown" }}
                            </span>
                            <span v-if="s.rank" class="inline-flex items-center gap-1.5"><Icon name="heroicons-outline:trending-up" class="h-4 w-4" />#{{ s.rank }}</span>
                            <a v-if="rating.count" href="#reviews" class="inline-flex items-center gap-1.5 hover:text-ink"><Stars :value="rating.avg" />{{ rating.avg.toFixed(1) }} <span class="text-dim">({{ rating.count }})</span></a>
                        </p>
                    </div>
                </div>
                <div class="flex w-full shrink-0 items-center gap-2 lg:w-auto">
                    <CopyIp :ip="s.ip" large class="min-w-0 flex-1 sm:w-64 sm:flex-none" />
                    <VoteButton v-if="!s.isOwner" :server="s" large @voted="onVoted" />
                    <NuxtLink v-else :to="`/your-servers/${s.id}`" class="btn-ghost"><Icon name="heroicons-outline:pencil-square" class="h-4 w-4" />Edit server</NuxtLink>
                </div>
            </div>

            <div class="mt-7 grid gap-6 lg:grid-cols-[1fr_320px]">
                <div class="min-w-0 space-y-6">
                    <div class="panel p-5 sm:p-6">
                        <h2 class="text-[15px] font-semibold">About</h2>
                        <p v-if="s.description" class="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">{{ s.description }}</p>
                        <p v-else class="mt-3 text-sm text-dim">No description yet.</p>
                        <div v-if="s.tags?.length" class="mt-4 flex flex-wrap gap-1.5">
                            <NuxtLink v-for="t in s.tags" :key="t" :to="{ path: '/find', query: { tags: t.toLowerCase() } }" class="chip">{{ formatTag(t) }}</NuxtLink>
                        </div>
                    </div>

                    <div class="panel p-5 sm:p-6">
                        <div class="flex flex-wrap items-center justify-between gap-3">
                            <h2 class="text-[15px] font-semibold">Players</h2>
                            <div class="flex rounded-lg border border-line-strong p-0.5 text-xs">
                                <button v-for="r in (['24h', '7d'] as const)" :key="r" type="button" class="cursor-pointer rounded-md px-3 py-1 font-medium" :class="range === r ? 'bg-raised text-ink' : 'text-muted hover:text-ink'" @click="range = r">{{ r === "24h" ? "24 hours" : "7 days" }}</button>
                            </div>
                        </div>
                        <div class="mt-4 grid grid-cols-3 gap-3 text-sm">
                            <div><p class="text-xs text-dim">Now</p><p class="mt-0.5 font-semibold">{{ s.online && typeof s.players === "number" ? s.players : "—" }}</p></div>
                            <div><p class="text-xs text-dim">Peak</p><p class="mt-0.5 font-semibold">{{ history?.points.length ? history.peak : "—" }}</p></div>
                            <div><p class="text-xs text-dim">Uptime</p><p class="mt-0.5 font-semibold">{{ history?.uptime != null ? `${history.uptime}%` : "—" }}</p></div>
                        </div>
                        <div class="mt-4">
                            <ClientOnly>
                                <PlayerChart v-if="history?.points.length" :points="history.points" :range="range" />
                                <div v-else class="grid h-48 place-items-center rounded-lg border border-dashed border-line-strong text-center text-sm text-dim">
                                    <p>No history yet.<br />Player counts are recorded every 5 minutes.</p>
                                </div>
                                <template #fallback><div class="h-48 animate-pulse rounded-lg bg-raised" /></template>
                            </ClientOnly>
                        </div>
                    </div>
                    <div id="reviews" class="scroll-mt-20">
                        <ServerReviews :server-id="id" :is-owner="!!s.isOwner" @changed="refreshInfo" />
                    </div>
                </div>

                <aside class="space-y-6">
                    <div class="panel p-5">
                        <h2 class="text-[15px] font-semibold">Server info</h2>
                        <dl class="mt-3 divide-y divide-line text-sm">
                            <div class="flex justify-between gap-3 py-2"><dt class="text-muted">Address</dt><dd class="truncate font-mono text-xs leading-5">{{ s.host }}</dd></div>
                            <div class="flex justify-between gap-3 py-2"><dt class="text-muted">Port</dt><dd class="font-mono text-xs leading-5">{{ s.port }}</dd></div>
                            <div class="flex justify-between gap-3 py-2"><dt class="text-muted">Votes this month</dt><dd class="font-semibold">{{ votes.month }}</dd></div>
                            <div class="flex justify-between gap-3 py-2"><dt class="text-muted">Votes all time</dt><dd>{{ votes.total }}</dd></div>
                            <div class="flex justify-between gap-3 py-2"><dt class="text-muted">Listed</dt><dd>{{ new Date(s.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) }}</dd></div>
                            <div v-if="s.ownerName" class="flex justify-between gap-3 py-2"><dt class="text-muted">Owner</dt><dd class="truncate"><NuxtLink :to="`/u/${s.ownerId}`" class="hover:text-accent hover:underline">{{ s.ownerName }}</NuxtLink></dd></div>
                        </dl>
                    </div>

                    <div v-if="links.length" class="panel p-5">
                        <h2 class="text-[15px] font-semibold">Links</h2>
                        <div class="mt-3 grid gap-2">
                            <a v-for="l in links" :key="l.key" :href="l.url" target="_blank" rel="noopener nofollow ugc" class="btn-ghost justify-start"><Icon :name="l.icon" class="h-4 w-4" />{{ l.label }}<Icon name="heroicons-outline:arrow-top-right-on-square" class="ml-auto h-4 w-4 text-dim" /></a>
                        </div>
                    </div>

                    <div class="panel p-5">
                        <h2 class="text-[15px] font-semibold">Latest votes</h2>
                        <ul v-if="s.lastVotes?.length" class="mt-3 space-y-2.5">
                            <li v-for="(v, i) in s.lastVotes" :key="i" class="flex items-center gap-2.5 text-sm">
                                <span class="grid h-6 w-6 shrink-0 place-items-center overflow-hidden rounded-full bg-raised text-[10px] font-semibold text-muted">
                                    <img v-if="v.avatarUrl" :src="v.avatarUrl" alt="" class="h-full w-full object-cover" />
                                    <template v-else>{{ (v.name[0] || "M").toUpperCase() }}</template>
                                </span>
                                <NuxtLink :to="`/u/${v.userId}`" class="min-w-0 flex-1 truncate hover:text-accent">{{ v.name }}</NuxtLink>
                                <span class="shrink-0 text-xs text-dim">{{ ago(v.at) }}</span>
                            </li>
                        </ul>
                        <p v-else class="mt-2 text-sm text-dim">No votes yet. Be the first!</p>
                    </div>

                    <button v-if="!s.isOwner" type="button" class="inline-flex cursor-pointer items-center gap-1.5 text-sm text-dim hover:text-danger" @click="openReport"><Icon name="heroicons-outline:flag" class="h-4 w-4" />Report this server</button>
                </aside>
            </div>
        </template>

        <ConfirmModal v-if="reportOpen" :disable-close="reporting" @close="reportOpen = false">
            <template #title><p class="flex items-center gap-2 font-semibold"><Icon name="heroicons-outline:flag" class="h-5 w-5 text-danger" />Report {{ s?.name }}</p></template>
            <template #content>
                <div class="space-y-4">
                    <div>
                        <p class="label">Reason</p>
                        <div class="mt-2 grid gap-1.5">
                            <label v-for="(label, key) in REASONS" :key="key" class="flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors" :class="reportReason === key ? 'border-accent text-ink' : 'border-line-strong text-muted hover:text-ink'">
                                <input v-model="reportReason" type="radio" :value="key" class="accent-[#3fb8af]" />{{ label }}
                            </label>
                        </div>
                    </div>
                    <div>
                        <label class="label" for="report-details">Details <span class="text-dim">({{ reportReason === "other" ? "required" : "optional" }})</span></label>
                        <textarea id="report-details" v-model="reportDetails" rows="3" maxlength="1000" class="field mt-1.5 resize-y" placeholder="What's wrong with this listing?" />
                    </div>
                    <p v-if="reportError" class="text-sm text-danger">{{ reportError }}</p>
                </div>
            </template>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <button type="button" class="btn-ghost" :disabled="reporting" @click="reportOpen = false">Cancel</button>
                    <button type="button" class="btn-danger" :disabled="reporting || !reportReason" @click="sendReport">{{ reporting ? "Sending…" : "Send report" }}</button>
                </div>
            </template>
        </ConfirmModal>
    </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { formatTag } from "~/utils/tags";
import { countryFlagUrl } from "~/utils/countries";
import { SERVER_LINKS, type ServerLinkKey } from "~/utils/serverLinks";

type ServerPage = {
    id: string;
    name: string;
    description?: string;
    tags: string[];
    ip: string;
    host: string;
    port: number;
    country?: string;
    online: boolean;
    players?: number;
    capacity?: number;
    logoUrl?: string;
    bannerUrl?: string;
    isFeatured?: boolean;
    isSponsored?: boolean;
    verified?: boolean;
    voteRewards?: boolean;
    votesMonth: number;
    votesTotal: number;
    rank: number | null;
    createdAt: number;
    links: Record<ServerLinkKey, string>;
    lastVotes: { at: number; userId: string; name: string; avatarUrl: string | null }[];
    rating?: { avg: number; count: number };
    ownerName: string | null;
    ownerId: string | null;
    isOwner: boolean;
};

const REASONS = {
    offline: "Always offline / wrong IP",
    wrong_info: "Wrong information",
    inappropriate: "Inappropriate content",
    scam: "Scam or malicious",
    other: "Other",
} as const;

const route = useRoute();
const id = computed(() => String(route.params.id || ""));
const toast = useAppToast();
const { user } = useAuth();
useVotes().autoLoad();

const { data, error, refresh: refreshInfo } = await useFetch<{ server: ServerPage }>(() => `/api/servers/${id.value}/info`);
const s = computed(() => data.value?.server ?? null);
const rating = computed(() => s.value?.rating ?? { avg: 0, count: 0 });
const links = computed(() => SERVER_LINKS.filter((l) => s.value?.links?.[l.key]).map((l) => ({ ...l, url: s.value!.links[l.key] })));

function ago(t: number) {
    const m = Math.max(1, Math.round((Date.now() - t) / 60000));
    if (m < 60) return `${m} min ago`;
    const h = Math.round(m / 60);
    return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
}

const range = ref<"24h" | "7d">("24h");
const { data: history } = await useFetch<{ points: { t: number; players: number | null; online: boolean }[]; peak: number; uptime: number | null }>(() => `/api/servers/${id.value}/history`, { query: { range }, server: false });

const votes = ref({ month: 0, total: 0 });
watch(s, (v) => (votes.value = { month: v?.votesMonth ?? 0, total: v?.votesTotal ?? 0 }), { immediate: true });
function onVoted(counts: { month: number; total: number }) {
    votes.value = counts;
}

const origin = useRequestURL().origin;
useHead(() => ({
    title: s.value ? `${s.value.name} — Hytale server on HyList` : "Server — HyList",
    meta: s.value
        ? [
            { name: "description", content: (s.value.description || `${s.value.name} Hytale server. IP: ${s.value.ip}`).slice(0, 160) },
            { property: "og:title", content: `${s.value.name} — Hytale server` },
            { property: "og:description", content: `IP: ${s.value.ip} · ${s.value.online ? "Online" : "Offline"} · ${s.value.votesMonth} votes this month` },
            ...(s.value.bannerUrl ? [{ property: "og:image", content: new URL(s.value.bannerUrl, origin).toString() }] : []),
        ]
        : [],
}));

onMounted(() => {
    if (s.value && !s.value.isOwner) $fetch(`/api/servers/${id.value}/view`, { method: "POST" }).catch(() => null);
});

const reportOpen = ref(false);
const reportReason = ref<keyof typeof REASONS | "">("");
const reportDetails = ref("");
const reportError = ref<string | null>(null);
const reporting = ref(false);

function openReport() {
    if (!user.value) return navigateTo({ path: "/auth/login", query: { next: route.fullPath } });
    reportReason.value = "";
    reportDetails.value = "";
    reportError.value = null;
    reportOpen.value = true;
}

async function sendReport() {
    reporting.value = true;
    reportError.value = null;
    try {
        await $fetch(`/api/servers/${id.value}/report`, { method: "POST", body: { reason: reportReason.value, details: reportDetails.value } });
        reportOpen.value = false;
        toast.success("Thanks, an admin will review it");
    } catch (e: any) {
        reportError.value = e?.data?.message || "Couldn't send the report";
    } finally {
        reporting.value = false;
    }
}
</script>
