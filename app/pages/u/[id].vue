<template>
    <section class="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">
        <div v-if="error" class="panel mt-6 p-10 text-center">
            <p class="font-medium">{{ error.statusCode === 404 ? "This user doesn't exist." : "Couldn't load this profile." }}</p>
            <NuxtLink to="/" class="btn-ghost mt-4">Back to the list</NuxtLink>
        </div>

        <template v-else-if="data">
            <div class="overflow-hidden rounded-[10px] border border-line bg-surface">
                <div class="banner-empty h-24 border-b border-line sm:h-28" />
                <div class="flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-end sm:px-7">
                    <div class="-mt-10 h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 border-surface bg-raised sm:h-[88px] sm:w-[88px]">
                        <img v-if="u.avatarUrl" :src="u.avatarUrl" alt="" class="h-full w-full object-cover" />
                        <span v-else class="grid h-full w-full place-items-center text-2xl font-semibold text-muted">{{ (u.name[0] || "M").toUpperCase() }}</span>
                    </div>
                    <div class="min-w-0 flex-1">
                        <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                            <h1 class="truncate text-2xl font-bold tracking-tight">{{ u.name }}</h1>
                            <span v-if="u.role === 'admin'" class="text-[11px] font-bold tracking-wider text-accent">ADMIN</span>
                            <span v-else-if="u.role === 'vip'" class="text-[11px] font-bold tracking-wider text-vip">VIP</span>
                        </div>
                        <p class="mt-0.5 text-sm text-muted">Member since {{ fmtDate(u.memberSince) }}</p>
                    </div>
                    <NuxtLink v-if="u.isMe" to="/profile" class="btn-ghost self-start sm:self-auto"><Icon name="heroicons-outline:squares-2x2" class="h-4 w-4" />Your dashboard</NuxtLink>
                </div>
                <div class="grid grid-cols-2 divide-x divide-line border-t border-line sm:grid-cols-4">
                    <div v-for="s in statCards" :key="s.label" class="px-5 py-3 sm:px-7">
                        <p class="text-lg font-bold">{{ s.value.toLocaleString("en-US") }}</p>
                        <p class="text-xs text-dim">{{ s.label }}</p>
                    </div>
                </div>
            </div>

            <h2 class="mt-8 text-lg font-semibold">Servers</h2>
            <div v-if="data.servers.length" class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <WelcomeServerListCard v-for="s in data.servers" :key="s.id" :rank="s.rank" :featured="!!s.isFeatured" :sponsored="!!s.isSponsored" :server="s" />
            </div>
            <p v-else class="panel mt-4 p-6 text-sm text-muted">{{ u.name }} hasn't listed any servers.</p>

            <div class="mt-8 flex flex-wrap items-center justify-between gap-3">
                <h2 class="text-lg font-semibold">Reviews</h2>
                <div class="flex rounded-lg border border-line-strong p-0.5 text-xs">
                    <button v-for="t in reviewTabs" :key="t.id" type="button" class="cursor-pointer rounded-md px-3 py-1.5 font-medium" :class="reviewTab === t.id ? 'bg-raised text-ink' : 'text-muted hover:text-ink'" @click="reviewTab = t.id">{{ t.label }} <span class="font-mono text-dim">{{ t.count }}</span></button>
                </div>
            </div>
            <ul v-if="shownReviews.length" class="panel mt-4 divide-y divide-line">
                <li v-for="r in shownReviews" :key="r.id" class="flex gap-3 p-4">
                    <NuxtLink :to="`/server/${r.server.id}#reviews`" class="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-line-strong text-sm font-semibold text-muted">
                        <img v-if="r.server.logoUrl" :src="r.server.logoUrl" alt="" class="h-full w-full object-cover" />
                        <template v-else>{{ (r.server.name[0] || "S").toUpperCase() }}</template>
                    </NuxtLink>
                    <div class="min-w-0 flex-1">
                        <p class="flex flex-wrap items-center gap-x-2 text-sm">
                            <NuxtLink :to="`/server/${r.server.id}#reviews`" class="font-medium hover:text-accent">{{ r.server.name }}</NuxtLink>
                            <Stars :value="r.rating" />
                            <span class="text-xs text-dim">{{ fmtDate(r.at) }}</span>
                        </p>
                        <p class="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted">{{ r.body }}</p>
                        <p v-if="reviewTab === 'received'" class="mt-1 text-xs text-dim">by <NuxtLink :to="`/u/${r.author.id}`" class="hover:text-ink">{{ r.author.name }}</NuxtLink></p>
                    </div>
                </li>
            </ul>
            <p v-else class="panel mt-4 p-6 text-sm text-muted">{{ reviewTab === "received" ? `No one has reviewed ${u.name}'s servers yet.` : `${u.name} hasn't written any reviews yet.` }}</p>
        </template>
    </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

type ProfileReview = { id: string; rating: number; body: string; at: number; server: { id: string; name: string; logoUrl: string | null }; author: { id: string; name: string } };
type Profile = {
    user: { id: string; name: string; avatarUrl: string | null; role: "admin" | "vip" | "user"; memberSince: number; isMe: boolean };
    stats: { servers: number; votesReceived: number; votesCast: number; reviewsWritten: number };
    servers: any[];
    reviewsReceived: ProfileReview[];
    reviewsWritten: ProfileReview[];
};

const route = useRoute();
useVotes().autoLoad();
const { data, error } = await useFetch<Profile>(() => `/api/users/${route.params.id}`);
const u = computed(() => data.value!.user);

useHead(() => ({ title: data.value ? `${data.value.user.name} — HyList` : "Profile — HyList" }));

const statCards = computed(() => [
    { label: "servers", value: data.value?.stats.servers ?? 0 },
    { label: "votes received", value: data.value?.stats.votesReceived ?? 0 },
    { label: "votes cast", value: data.value?.stats.votesCast ?? 0 },
    { label: "reviews written", value: data.value?.stats.reviewsWritten ?? 0 },
]);

const reviewTab = ref<"received" | "written">("received");
watch(data, (d) => (reviewTab.value = d && !d.reviewsReceived.length && d.reviewsWritten.length ? "written" : "received"), { immediate: true });
const reviewTabs = computed(() => [
    { id: "received" as const, label: "About their servers", count: data.value?.reviewsReceived.length ?? 0 },
    { id: "written" as const, label: "Written", count: data.value?.reviewsWritten.length ?? 0 },
]);
const shownReviews = computed(() => (reviewTab.value === "received" ? data.value?.reviewsReceived : data.value?.reviewsWritten) ?? []);

const fmtDate = (t: number) => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
</script>
