<template>
    <section class="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">
        <div class="overflow-hidden rounded-[10px] border border-line bg-surface">
            <div class="banner-empty h-24 border-b border-line sm:h-28" />
            <div class="flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-end sm:px-7">
                <div class="-mt-10 h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 border-surface bg-raised sm:h-[88px] sm:w-[88px]">
                    <img v-if="user?.avatarUrl" :src="user.avatarUrl" alt="" class="h-full w-full object-cover" />
                    <span v-else class="grid h-full w-full place-items-center text-2xl font-semibold text-muted">{{ initial }}</span>
                </div>
                <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <h1 class="truncate text-2xl font-bold tracking-tight">{{ user?.displayName || "User" }}</h1>
                        <span v-if="user?.role === 'admin'" class="text-[11px] font-bold tracking-wider text-accent">ADMIN</span>
                        <span v-else-if="user?.role === 'vip'" class="text-[11px] font-bold tracking-wider text-vip">VIP</span>
                    </div>
                    <p class="mt-0.5 text-sm text-muted">
                        <template v-if="data?.memberSince">Member since {{ fmtDate(data.memberSince) }}</template>
                        <template v-if="user?.role === 'vip' && user?.vipUntil"> · VIP until {{ fmtDate(user.vipUntil) }}</template>
                    </p>
                </div>
                <NuxtLink v-if="user" :to="`/u/${user.id}`" class="btn-ghost self-start sm:self-auto"><Icon name="heroicons-outline:eye" class="h-4 w-4" />View public profile</NuxtLink>
            </div>

            <nav class="flex gap-6 no-scrollbar overflow-x-auto border-t border-line px-5 sm:px-7">
                <button v-for="t in tabs" :key="t.id" type="button" class="inline-flex shrink-0 cursor-pointer items-center gap-1.5 border-b-2 py-3 text-sm font-medium transition-colors" :class="tab === t.id ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink'" @click="setTab(t.id)">
                    {{ t.label }}<span v-if="t.count !== undefined" class="font-mono text-xs text-dim">{{ t.count }}</span>
                </button>
            </nav>
        </div>

        <div v-if="pending" class="panel mt-6 h-48 animate-pulse" />
        <div v-else-if="error" class="panel mt-6 p-6 text-sm text-danger">Couldn't load your profile.</div>

        <template v-else-if="data">
            <div v-if="tab === 'overview'" class="mt-6 space-y-6">
                <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <div v-for="s in statCards" :key="s.label" class="panel p-4">
                        <p class="text-xl font-bold" :class="s.accent">{{ s.value.toLocaleString("en-US") }}</p>
                        <p class="mt-0.5 text-xs text-dim">{{ s.label }}</p>
                    </div>
                </div>
                <div class="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                    <div class="panel p-5">
                        <div class="flex items-center justify-between">
                            <h2 class="text-xs font-semibold uppercase tracking-wider text-muted">Your servers</h2>
                            <button v-if="data.servers.length > 3" type="button" class="cursor-pointer text-xs text-accent hover:underline" @click="setTab('servers')">See all</button>
                        </div>
                        <ul v-if="data.servers.length" class="mt-2 divide-y divide-line">
                            <li v-for="s in data.servers.slice(0, 3)" :key="s.id"><ProfileServerRow :server="s" /></li>
                        </ul>
                        <div v-else class="mt-3 text-sm text-muted">
                            You haven't listed a server yet.
                            <NuxtLink to="/add" class="btn-primary mt-3 flex w-fit"><Icon name="heroicons-outline:plus" class="h-4 w-4" />Add server</NuxtLink>
                        </div>
                    </div>
                    <div class="panel p-5">
                        <div class="flex items-center justify-between">
                            <h2 class="text-xs font-semibold uppercase tracking-wider text-muted">Vote again</h2>
                            <button v-if="data.votes.length > 4" type="button" class="cursor-pointer text-xs text-accent hover:underline" @click="setTab('votes')">See all</button>
                        </div>
                        <ul v-if="data.votes.length" class="mt-2 divide-y divide-line">
                            <li v-for="v in data.votes.slice(0, 4)" :key="v.server.id"><ProfileVoteRow :vote="v" compact /></li>
                        </ul>
                        <p v-else class="mt-3 text-sm text-muted">Servers you vote for show up here, so you can vote again the next day. <NuxtLink to="/" class="text-accent hover:underline">Browse servers</NuxtLink></p>
                    </div>
                </div>
            </div>

            <div v-else-if="tab === 'servers'" class="panel mt-6 p-5">
                <div class="flex items-center justify-between gap-3">
                    <h2 class="text-[15px] font-semibold">Your servers</h2>
                    <NuxtLink to="/add" class="btn-primary py-2"><Icon name="heroicons-outline:plus" class="h-4 w-4" />Add server</NuxtLink>
                </div>
                <ul v-if="data.servers.length" class="mt-3 divide-y divide-line">
                    <li v-for="s in data.servers" :key="s.id"><ProfileServerRow :server="s" detailed /></li>
                </ul>
                <p v-else class="mt-3 text-sm text-muted">You haven't listed a server yet.</p>
            </div>

            <div v-else class="panel mt-6 p-5">
                <h2 class="text-[15px] font-semibold">Servers you voted for</h2>
                <p class="mt-1 text-sm text-muted">You can vote for each server once every 24 hours.</p>
                <ul v-if="data.votes.length" class="mt-3 divide-y divide-line">
                    <li v-for="v in data.votes" :key="v.server.id"><ProfileVoteRow :vote="v" /></li>
                </ul>
                <p v-else class="mt-4 text-sm text-muted">No votes yet. <NuxtLink to="/" class="text-accent hover:underline">Find a server to vote for</NuxtLink></p>
            </div>

        </template>
    </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

definePageMeta({ middleware: "auth" });
useHead({ title: "Profile — HyList" });

type Overview = {
    memberSince: number | null;
    stats: { servers: number; online: number; votesReceived: number; votesCast: number };
    servers: { id: string; name: string; logoUrl?: string; online: boolean; players?: number; capacity?: number; rank: number | null; verified: boolean; votesMonth: number; votesTotal: number }[];
    votes: { server: { id: string; name: string; logoUrl?: string; online: boolean; voteRewards?: boolean; votesMonth: number }; count: number; lastVotedAt: number; nextVoteAt: number | null }[];
};

const { user } = useAuth();
const route = useRoute();
useVotes().autoLoad();

const { data, pending, error } = await useFetch<Overview>("/api/auth/overview");

type TabId = "overview" | "servers" | "votes";
const tab = computed<TabId>(() => (["servers", "votes"].includes(String(route.query.tab)) ? (route.query.tab as TabId) : "overview"));
const tabs = computed(() => [
    { id: "overview" as const, label: "Overview", count: undefined },
    { id: "servers" as const, label: "Servers", count: data.value?.stats.servers },
    { id: "votes" as const, label: "Votes", count: data.value?.votes.length },
]);
function setTab(id: TabId) {
    navigateTo({ query: { ...route.query, tab: id === "overview" ? undefined : id } }, { replace: true });
}

const statCards = computed(() => {
    const s = data.value?.stats;
    return [
        { label: "servers listed", value: s?.servers ?? 0, accent: "" },
        { label: "online now", value: s?.online ?? 0, accent: s?.online ? "text-online" : "" },
        { label: "votes received", value: s?.votesReceived ?? 0, accent: "" },
        { label: "votes cast", value: s?.votesCast ?? 0, accent: "" },
    ];
});

const initial = computed(() => (user.value?.displayName?.trim()?.[0] || "U").toUpperCase());
const fmtDate = (t: number) => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
</script>
