<template>
    <div class="grid gap-6 lg:grid-cols-3">
        <div class="panel p-5">
            <h2 class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted"><Icon name="heroicons-outline:sparkles" class="h-4 w-4" />New servers</h2>
            <ul v-if="data?.newest.length" class="mt-3 space-y-1">
                <li v-for="s in data.newest" :key="s.id">
                    <NuxtLink :to="`/server/${s.id}`" class="flex items-center gap-3 rounded-md px-1.5 py-1.5 hover:bg-raised">
                        <Logo :url="s.logoUrl" :name="s.name" />
                        <span class="min-w-0 flex-1">
                            <span class="block truncate text-sm">{{ s.name }}</span>
                            <span class="block truncate text-xs text-dim">{{ s.country }}</span>
                        </span>
                        <span class="shrink-0 text-xs text-dim">{{ ago(s.at) }}</span>
                    </NuxtLink>
                </li>
            </ul>
            <p v-else class="mt-3 text-sm text-dim">No servers yet.</p>
        </div>

        <div class="panel p-5">
            <h2 class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted"><Icon name="heroicons-outline:chat-bubble-bottom-center-text" class="h-4 w-4" />Latest reviews</h2>
            <ul v-if="data?.reviews.length" class="mt-3 space-y-1">
                <li v-for="(r, i) in data.reviews" :key="i">
                    <div class="rounded-md px-1.5 py-2">
                        <span class="flex items-center gap-2 text-sm">
                            <NuxtLink :to="`/server/${r.server.id}#reviews`" class="min-w-0 flex-1 truncate font-medium hover:text-accent">{{ r.server.name }}</NuxtLink>
                            <Stars :value="r.rating" />
                        </span>
                        <span class="mt-1 line-clamp-2 block text-xs leading-relaxed text-muted">“{{ r.body }}”</span>
                        <span class="mt-1 block text-xs text-dim"><NuxtLink :to="`/u/${r.authorId}`" class="hover:text-ink">{{ r.author }}</NuxtLink> · {{ ago(r.at) }}</span>
                    </div>
                </li>
            </ul>
            <p v-else class="mt-3 text-sm text-dim">No reviews yet. Open a server you play on and write the first one.</p>
        </div>

        <div class="panel p-5">
            <h2 class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted"><Icon name="heroicons-outline:chevron-double-up" class="h-4 w-4" />Recent votes</h2>
            <ul v-if="data?.votes.length" class="mt-3 space-y-1">
                <li v-for="(v, i) in data.votes" :key="i">
                    <div class="flex items-center gap-3 rounded-md px-1.5 py-1.5 text-sm">
                        <NuxtLink :to="`/server/${v.server.id}`"><Logo :url="v.server.logoUrl" :name="v.server.name" /></NuxtLink>
                        <span class="min-w-0 flex-1 truncate"><NuxtLink :to="`/u/${v.voterId}`" class="text-ink hover:text-accent">{{ v.voter }}</NuxtLink> <span class="text-dim">voted for</span> <NuxtLink :to="`/server/${v.server.id}`" class="hover:text-accent">{{ v.server.name }}</NuxtLink></span>
                        <span class="shrink-0 text-xs text-dim">{{ ago(v.at) }}</span>
                    </div>
                </li>
            </ul>
            <p v-else class="mt-3 text-sm text-dim">No votes yet.</p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { h } from "vue";

type Srv = { id: string; name: string; logoUrl: string | null };
type Activity = {
    newest: (Srv & { country: string; at: number })[];
    reviews: { rating: number; body: string; at: number; author: string; authorId: string; server: Srv }[];
    votes: { at: number; voter: string; voterId: string; server: Srv }[];
};

const Logo = (p: { url: string | null; name: string }) =>
    h("span", { class: "grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-md bg-line-strong text-xs font-semibold text-muted" }, p.url ? [h("img", { src: p.url, alt: "", class: "h-full w-full object-cover" })] : (p.name.trim()[0] || "S").toUpperCase());

const { data } = await useFetch<Activity>("/api/activity", { server: false });

function ago(t: number) {
    const m = Math.max(1, Math.round((Date.now() - t) / 60000));
    if (m < 60) return `${m}m`;
    const hrs = Math.round(m / 60);
    return hrs < 24 ? `${hrs}h` : `${Math.round(hrs / 24)}d`;
}
</script>
