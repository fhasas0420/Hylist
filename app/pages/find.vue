<template>
    <section class="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div class="pb-7 pt-11">
            <h1 class="text-[34px] font-bold leading-tight tracking-tight">Search servers</h1>
            <p class="mt-2 text-[15px] text-muted">Combine filters to narrow the list down.</p>
        </div>

        <div class="grid gap-6 lg:grid-cols-[260px_1fr]">
            <aside class="panel h-fit space-y-5 p-4">
                <div>
                    <label class="label" for="q">Name, IP or tag</label>
                    <div class="relative mt-1.5">
                        <Icon name="heroicons-outline:magnifying-glass" class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dim" />
                        <input id="q" v-model="query" type="search" class="field pl-9" placeholder="e.g. survival" />
                    </div>
                </div>

                <div>
                    <label class="label" for="country">Country</label>
                    <select id="country" v-model="country" class="field mt-1.5">
                        <option value="">Any country</option>
                        <option v-for="c in COUNTRIES" :key="c" :value="c">{{ c }}</option>
                    </select>
                </div>

                <div>
                    <p class="label">Tags <span class="text-dim">(all must match)</span></p>
                    <div class="mt-2 flex flex-wrap gap-1.5">
                        <button v-for="t in TAGS" :key="t" type="button" class="chip" :class="tags.includes(t.toLowerCase()) && 'chip-on'" :aria-pressed="tags.includes(t.toLowerCase())" @click="toggleTag(t)">
                            {{ t }}
                        </button>
                    </div>
                </div>

                <div class="space-y-2.5 border-t border-line pt-4">
                    <label class="flex cursor-pointer items-center gap-2.5 text-sm"><input v-model="onlineOnly" type="checkbox" class="h-4 w-4 accent-accent" /> Online only</label>
                    <label class="flex cursor-pointer items-center gap-2.5 text-sm"><input v-model="featuredOnly" type="checkbox" class="h-4 w-4 accent-accent" /> Featured only</label>
                    <label class="flex cursor-pointer items-center gap-2.5 text-sm"><input v-model="vipOnly" type="checkbox" class="h-4 w-4 accent-accent" /> VIP only</label>
                </div>

                <button type="button" class="btn-ghost w-full" @click="resetAll"><Icon name="heroicons-outline:arrow-path" class="h-4 w-4" />Reset filters</button>
            </aside>

            <div>
                <p v-if="!pending && !error" class="mb-3 text-sm text-muted">{{ filtered.length }} {{ filtered.length === 1 ? "server" : "servers" }} found</p>

                <div v-if="pending" class="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                    <div v-for="n in 6" :key="n" class="h-72 animate-pulse rounded-[10px] border border-line bg-surface" />
                </div>
                <div v-else-if="error" class="panel p-6 text-sm text-danger">Couldn't load the server list. Try again in a minute.</div>
                <template v-else>
                    <div class="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                        <WelcomeServerListCard v-for="(s, i) in filtered" :key="s.id" :rank="i + 1" :featured="!!s.isFeatured" :sponsored="!!s.isSponsored" :server="s" />
                    </div>
                    <div v-if="filtered.length === 0" class="panel p-10 text-center">
                        <p class="font-medium">Nothing matches these filters.</p>
                        <p class="mt-1 text-sm text-muted">Try removing a tag or choosing another country.</p>
                    </div>
                </template>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from "vue";
import { TAGS } from "~/utils/tags";
import { COUNTRIES } from "~/utils/countries";

useHead({ title: "Search — HyList" });

type PublicServer = {
    id: string;
    name: string;
    description?: string;
    tags: string[];
    ip: string;
    country: string;
    online: boolean;
    players?: number;
    capacity?: number;
    isFeatured?: boolean;
    isSponsored?: boolean;
    logoUrl?: string;
    bannerUrl?: string;
    votesMonth?: number;
    votesTotal?: number;
};

const route = useRoute();
const query = ref(String(route.query.query || ""));
const country = ref(String(route.query.country || ""));
const tags = ref<string[]>(String(route.query.tags || "").split(",").map((t) => t.trim().toLowerCase()).filter(Boolean));
const onlineOnly = ref(route.query.online === "1");
const featuredOnly = ref(route.query.featured === "1");
const vipOnly = ref(route.query.vip === "1");

watch([query, country, tags, onlineOnly, featuredOnly, vipOnly], () => {
    const q: Record<string, string> = {};
    if (query.value.trim()) q.query = query.value.trim();
    if (country.value) q.country = country.value;
    if (tags.value.length) q.tags = tags.value.join(",");
    if (onlineOnly.value) q.online = "1";
    if (featuredOnly.value) q.featured = "1";
    if (vipOnly.value) q.vip = "1";
    navigateTo({ path: "/find", query: q }, { replace: true });
}, { deep: true });

const { data, pending, error } = await useFetch<{ servers: PublicServer[] }>("/api/servers/public");
useVotes().autoLoad();

const filtered = computed(() => {
    const q = query.value.trim().toLowerCase();
    return (data.value?.servers ?? []).filter((s) => {
        if (country.value && s.country !== country.value) return false;
        if (onlineOnly.value && !s.online) return false;
        if (featuredOnly.value && !s.isFeatured) return false;
        if (vipOnly.value && !s.isSponsored) return false;
        if (tags.value.length && !tags.value.every((t) => s.tags.some((st) => st.toLowerCase() === t))) return false;
        if (!q) return true;
        return s.name.toLowerCase().includes(q) || s.ip.toLowerCase().includes(q) || s.tags.some((t) => t.toLowerCase().includes(q));
    });
});

function toggleTag(t: string) {
    const key = t.toLowerCase();
    tags.value = tags.value.includes(key) ? tags.value.filter((x) => x !== key) : [...tags.value, key];
}

function resetAll() {
    query.value = "";
    country.value = "";
    tags.value = [];
    onlineOnly.value = false;
    featuredOnly.value = false;
    vipOnly.value = false;
}
</script>
