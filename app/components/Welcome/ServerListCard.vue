<template>
    <article class="group/card relative flex h-full min-w-0 flex-col overflow-hidden rounded-[10px] border bg-surface transition-colors hover:border-line-strong" :class="sponsored ? 'border-vip/40' : 'border-line'">
        <NuxtLink :to="`/server/${server.id}`" class="relative block h-28 bg-raised" tabindex="-1" aria-hidden="true">
            <img v-if="server.bannerUrl" :src="server.bannerUrl" alt="" loading="lazy" class="h-full w-full object-cover" />
            <div v-else class="banner-empty h-full w-full" />
            <span v-if="rank" class="absolute left-3 top-3 rounded-md bg-nav/85 px-2 py-0.5 font-mono text-xs font-medium text-ink">#{{ rank }}</span>
            <span class="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-nav/85 px-2 py-0.5 text-xs font-medium" :class="server.online ? 'text-online' : 'text-muted'">
                <span class="h-1.5 w-1.5 rounded-full" :class="server.online ? 'bg-online' : 'bg-dim'" />
                {{ server.online ? "Online" : "Offline" }}
            </span>
        </NuxtLink>

        <div class="flex flex-1 flex-col p-4">
            <div class="flex items-center gap-3">
                <div class="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-line-strong">
                    <img v-if="server.logoUrl && logoOk" :src="server.logoUrl" alt="" class="h-full w-full object-cover" @error="logoOk = false" />
                    <span v-else class="grid h-full w-full place-items-center text-sm font-semibold text-muted">{{ initial }}</span>
                </div>
                <div class="min-w-0 flex-1">
                    <div class="flex min-w-0 items-center gap-1.5">
                        <NuxtLink :to="`/server/${server.id}`" class="truncate text-[15px] font-semibold hover:text-accent">{{ server.name }}</NuxtLink>
                        <Icon v-if="server.verified" name="heroicons-outline:check-badge" class="h-4 w-4 shrink-0 text-accent" title="Verified owner" />
                        <span v-if="sponsored" class="ml-0.5 shrink-0 text-[10px] font-bold tracking-wider text-vip" title="Owned by a VIP supporter">VIP</span>
                        <span v-if="featured" class="ml-0.5 shrink-0 text-[10px] font-bold tracking-wider text-accent">FEATURED</span>
                    </div>
                    <p class="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
                        <span class="inline-flex min-w-0 items-center gap-1.5 whitespace-nowrap">
                            <img v-if="countryFlag(server.country)" :src="countryFlag(server.country)" alt="" class="h-2.5 w-4 rounded-[2px] object-cover" />
                            <Icon v-else name="heroicons-outline:map-pin" class="h-3.5 w-3.5" />
                            {{ server.country || "Unknown" }}
                        </span>
                        <span v-if="hasPlayers" class="inline-flex items-center gap-1 whitespace-nowrap">
                            <Icon name="heroicons-outline:users" class="h-3.5 w-3.5" />
                            {{ server.players }}/{{ server.capacity }}
                        </span>
                        <span v-if="server.rating?.count" class="inline-flex items-center gap-1 whitespace-nowrap" :title="`${server.rating.count} reviews`">
                            <svg viewBox="0 0 20 20" class="h-3.5 w-3.5 text-vip" fill="currentColor"><path d="M10 1.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6L10 15l-5.4 3 1.2-6L1.3 7.8l6.1-.7L10 1.5z" /></svg>{{ server.rating.avg.toFixed(1) }}
                        </span>
                    </p>
                </div>
            </div>

            <p v-if="server.description" class="mt-3 line-clamp-2 text-[13px] leading-relaxed text-muted">{{ server.description }}</p>

            <div v-if="visibleTags.length" class="mt-3 flex flex-wrap gap-1.5">
                <span v-for="t in visibleTags" :key="t" class="rounded-md bg-raised px-2 py-0.5 text-[11px] text-muted">{{ formatTag(t) }}</span>
                <button v-if="hiddenTagCount > 0 && !showAllTags" type="button" class="cursor-pointer rounded-md border border-dashed border-line-strong px-2 py-0.5 text-[11px] text-muted hover:border-accent hover:text-ink" :title="hiddenTags.map(formatTag).join(', ')" @click="showAllTags = true">+{{ hiddenTagCount }} more</button>
            </div>

            <div class="mt-auto flex items-center gap-2 pt-4">
                <CopyIp :ip="server.ip" class="min-w-0 flex-1" />
                <VoteButton :server="server" />
            </div>
        </div>
    </article>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { formatTag } from "~/utils/tags";
import { countryFlagUrl as countryFlag } from "~/utils/countries";

const props = defineProps<{
    rank?: number;
    featured?: boolean;
    sponsored?: boolean;
    server: {
        id: string;
        name: string;
        description?: string;
        players?: number;
        capacity?: number;
        online: boolean;
        tags: string[];
        ip: string;
        country?: string;
        logoUrl?: string;
        bannerUrl?: string;
        votesMonth?: number;
        votesTotal?: number;
        verified?: boolean;
        voteRewards?: boolean;
        rating?: { avg: number; count: number };
    };
}>();

const initial = computed(() => (props.server.name?.trim()?.[0] || "S").toUpperCase());
const hasPlayers = computed(() => props.server.online && typeof props.server.players === "number" && typeof props.server.capacity === "number");
const showAllTags = ref(false);
const allTags = computed(() => (Array.isArray(props.server.tags) ? props.server.tags : []));
const visibleTags = computed(() => (showAllTags.value ? allTags.value : allTags.value.slice(0, 3)));
const hiddenTags = computed(() => allTags.value.slice(3));
const hiddenTagCount = computed(() => hiddenTags.value.length);

const logoOk = ref(true);
watch(() => props.server.logoUrl, (v) => (logoOk.value = Boolean(v)), { immediate: true });
</script>
