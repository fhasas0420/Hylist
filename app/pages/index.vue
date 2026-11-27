<template>
    <div>
        <section class="hero-band border-b border-line">
            <div class="mx-auto grid max-w-6xl gap-10 px-4 pb-12 pt-14 sm:px-6 lg:grid-cols-[1fr_340px] lg:items-center">
                <div>
                    <p class="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                        <span class="h-1.5 w-1.5 rounded-full bg-online" />
                        {{ onlineCount }} of {{ servers.length }} servers online now
                    </p>
                    <h1 class="mt-4 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">Find your next<br />Hytale server.</h1>
                    <p class="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
                        Browse community servers with live status and player counts. Compare them by votes, filter by tags and country, and copy the IP in one click.
                    </p>

                    <form class="mt-7 flex max-w-xl gap-2" @submit.prevent="scrollToList">
                        <div class="relative flex-1">
                            <Icon name="heroicons-outline:magnifying-glass" class="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-dim" />
                            <input v-model="query" type="search" placeholder="Search by name, IP or tag" class="field h-12 pl-11 text-[15px]" />
                        </div>
                        <button type="submit" class="btn-primary h-12 px-5">Search</button>
                    </form>

                    <div class="mt-5 flex flex-wrap items-center gap-2">
                        <span class="mr-1 text-xs text-dim">Popular:</span>
                        <button v-for="t in popularTags" :key="t.name" type="button" class="chip cursor-pointer" :class="tag === t.name.toLowerCase() ? 'chip-on' : ''" @click="pickTag(t.name)">
                            {{ formatTag(t.name) }}<span class="ml-1 text-dim">{{ t.count }}</span>
                        </button>
                    </div>
                </div>

                <aside class="panel overflow-hidden">
                    <div class="grid grid-cols-3 divide-x divide-line border-b border-line">
                        <div class="p-4">
                            <b class="block text-xl font-bold">{{ servers.length.toLocaleString("en-US") }}</b>
                            <span class="text-[11px] uppercase tracking-wider text-dim">Servers</span>
                        </div>
                        <div class="p-4">
                            <b class="block text-xl font-bold text-online">{{ playersOnline.toLocaleString("en-US") }}</b>
                            <span class="text-[11px] uppercase tracking-wider text-dim">Playing</span>
                        </div>
                        <div class="p-4">
                            <b class="block text-xl font-bold">{{ votesThisMonth.toLocaleString("en-US") }}</b>
                            <span class="text-[11px] uppercase tracking-wider text-dim">Votes / mo</span>
                        </div>
                    </div>
                    <div class="p-4">
                        <p class="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted">
                            Top this month
                            <span class="font-normal normal-case tracking-normal text-dim">{{ monthName }}</span>
                        </p>
                        <ol v-if="top.length" class="mt-3 space-y-1">
                            <li v-for="(s, i) in top" :key="s.id">
                                <NuxtLink :to="`/server/${s.id}`" class="flex items-center gap-3 rounded-md px-1.5 py-1.5 text-sm hover:bg-raised">
                                    <span class="w-4 font-mono text-xs" :class="i === 0 ? 'text-vip' : 'text-dim'">{{ i + 1 }}</span>
                                    <span class="h-7 w-7 shrink-0 overflow-hidden rounded-md bg-line-strong">
                                        <img v-if="s.logoUrl" :src="s.logoUrl" alt="" class="h-full w-full object-cover" />
                                    </span>
                                    <span class="min-w-0 flex-1 truncate">{{ s.name }}</span>
                                    <span class="inline-flex items-center gap-1 font-mono text-xs text-muted"><Icon name="heroicons-outline:chevron-double-up" class="h-3.5 w-3.5" />{{ s.votesMonth ?? 0 }}</span>
                                </NuxtLink>
                            </li>
                        </ol>
                        <p v-else class="mt-3 text-sm text-dim">No servers yet.</p>
                        <p class="mt-3 border-t border-line pt-3 text-xs text-dim">Vote once a day. Monthly votes reset on the 1st.</p>
                    </div>
                </aside>
            </div>
        </section>

        <section id="list" class="mx-auto max-w-6xl scroll-mt-20 px-4 pt-10 sm:px-6">
            <div class="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h2 class="text-xl font-semibold">All servers</h2>
                    <p class="mt-1 text-sm text-muted">
                        {{ filtered.length }} {{ filtered.length === 1 ? "server" : "servers" }}<template v-if="hasFilters"> match your filters · <button type="button" class="cursor-pointer text-accent hover:underline" @click="resetFilters">clear</button></template>
                        <template v-else> · ranked by votes this month</template>
                    </p>
                </div>
                <div class="flex w-full gap-2 sm:w-auto">
                    <select v-model="country" class="field sm:w-48">
                        <option value="">All countries</option>
                        <option v-for="c in countries" :key="c" :value="c">{{ c }}</option>
                    </select>
                    <select v-model="tag" class="field sm:w-44">
                        <option value="">All tags</option>
                        <option v-for="t in TAGS" :key="t" :value="t.toLowerCase()">{{ formatTag(t) }}</option>
                    </select>
                </div>
            </div>

            <div v-if="pending" class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div v-for="n in 6" :key="n" class="h-72 animate-pulse rounded-[10px] border border-line bg-surface" />
            </div>
            <div v-else-if="error" class="panel mt-5 p-6 text-sm text-danger">Couldn't load the server list. Try again in a minute.</div>
            <template v-else>
                <div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <WelcomeServerListCard v-for="(s, i) in filtered" :key="s.id" :rank="i + 1" :featured="!!s.isFeatured" :sponsored="!!s.isSponsored" :server="s" />
                </div>
                <div v-if="filtered.length === 0 && hasFilters" class="panel mt-4 p-8 text-center">
                    <p class="font-medium">No servers match these filters.</p>
                    <button type="button" class="btn-ghost mt-4" @click="resetFilters">Clear filters</button>
                </div>
            </template>
        </section>

        <section class="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6">
            <h2 class="text-xl font-semibold">Activity</h2>
            <p class="mt-1 text-sm text-muted">What is happening on HyList right now.</p>
            <HomeActivity class="mt-5" />
        </section>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { TAGS, formatTag } from "~/utils/tags";

useHead({ title: "HyList — Hytale server list" });

type PublicServer = {
    id: string;
    name: string;
    description?: string;
    players?: number;
    capacity?: number;
    ping?: number;
    online: boolean;
    tags: string[];
    ip: string;
    country: string;
    isFeatured?: boolean;
    isSponsored?: boolean;
    logoUrl?: string;
    bannerUrl?: string;
    votesMonth?: number;
    votesTotal?: number;
};

const query = ref("");
const country = ref("");
const tag = ref("");

const { data, pending, error } = await useFetch<{ servers: PublicServer[] }>("/api/servers/public");
useVotes().autoLoad();

const servers = computed(() => data.value?.servers ?? []);
const onlineCount = computed(() => servers.value.filter((s) => s.online).length);
const playersOnline = computed(() => servers.value.reduce((sum, s) => sum + (s.online && typeof s.players === "number" ? s.players : 0), 0));
const votesThisMonth = computed(() => servers.value.reduce((sum, s) => sum + (s.votesMonth ?? 0), 0));
const countries = computed(() => [...new Set(servers.value.map((s) => s.country).filter((c) => c && c !== "Unknown"))].sort());
const top = computed(() => [...servers.value].sort((a, b) => (b.votesMonth ?? 0) - (a.votesMonth ?? 0) || (b.votesTotal ?? 0) - (a.votesTotal ?? 0)).slice(0, 3));
const monthName = new Date().toLocaleString("en-US", { month: "long", timeZone: "UTC" });

const popularTags = computed(() => {
    const counts = new Map<string, number>();
    for (const s of servers.value) for (const t of s.tags) counts.set(t.toLowerCase(), (counts.get(t.toLowerCase()) ?? 0) + 1);
    for (const t of TAGS) if (counts.size < 6 && !counts.has(t.toLowerCase())) counts.set(t.toLowerCase(), 0);
    return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 6);
});

const hasFilters = computed(() => Boolean(query.value.trim() || country.value || tag.value));

const filtered = computed(() => {
    const q = query.value.trim().toLowerCase();
    return servers.value.filter((s) => {
        if (country.value && s.country !== country.value) return false;
        if (tag.value && !s.tags.some((t) => t.toLowerCase() === tag.value)) return false;
        if (!q) return true;
        return s.name.toLowerCase().includes(q) || s.ip.toLowerCase().includes(q) || s.tags.some((t) => t.toLowerCase().includes(q));
    });
});

function pickTag(name: string) {
    tag.value = tag.value === name.toLowerCase() ? "" : name.toLowerCase();
    scrollToList();
}

function scrollToList() {
    document.getElementById("list")?.scrollIntoView({ behavior: "smooth" });
}

function resetFilters() {
    query.value = "";
    country.value = "";
    tag.value = "";
}
</script>
