<template>
    <section class="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div class="flex flex-wrap items-end justify-between gap-4 pb-7 pt-11">
            <div>
                <h1 class="text-[34px] font-bold leading-tight tracking-tight">Your servers</h1>
                <p class="mt-2 text-[15px] text-muted">Edit listings, upload a logo and banner, set up live status.</p>
            </div>
            <NuxtLink to="/add" class="btn-primary"><Icon name="heroicons-outline:plus" class="h-4 w-4" />Add server</NuxtLink>
        </div>

        <div v-if="notice" class="mb-5 flex items-center justify-between gap-4 rounded-[10px] border border-online/30 bg-online/5 px-4 py-3 text-sm">
            <span>{{ notice }}</span>
            <button type="button" class="cursor-pointer text-muted hover:text-ink" @click="dismissNotice">Dismiss</button>
        </div>

        <div v-if="pending" class="panel h-40 animate-pulse" />
        <div v-else-if="error" class="panel p-6 text-sm text-danger">Couldn't load your servers.</div>
        <div v-else-if="servers.length === 0" class="panel p-10 text-center">
            <p class="font-medium">You haven't listed any servers yet.</p>
            <NuxtLink to="/add" class="btn-primary mt-4">Add your first server</NuxtLink>
        </div>
        <ul v-else class="panel divide-y divide-line">
            <li v-for="s in servers" :key="s.id" class="flex flex-wrap items-center gap-4 p-4 sm:flex-nowrap">
                <div class="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-line-strong">
                    <img v-if="s.logoUrl && !brokenLogos[s.id]" :src="s.logoUrl" alt="" class="h-full w-full object-cover" @error="brokenLogos[s.id] = true" />
                    <span v-else class="grid h-full w-full place-items-center text-sm font-semibold text-muted">{{ initial(s.name) }}</span>
                </div>
                <div class="min-w-0 flex-1">
                    <p class="truncate font-semibold">{{ s.name }}</p>
                    <p class="mt-0.5 flex items-center gap-2 truncate text-xs text-dim">
                        <span class="font-mono">{{ s.host }}:{{ s.port }}</span>
                        <span aria-hidden="true">·</span>
                        <img v-if="countryFlag(s.country)" :src="countryFlag(s.country)" alt="" class="h-3 w-[18px] rounded-[2px] object-cover" />
                        <span>{{ s.country }}</span>
                    </p>
                </div>
                <div class="w-32 shrink-0 text-sm" title="Votes this month / all time">
                    <span class="inline-flex items-center gap-1.5 font-semibold"><Icon name="heroicons-outline:chevron-double-up" class="h-4 w-4 text-accent" />{{ s.votesMonth ?? 0 }}</span>
                    <span class="ml-1 text-xs text-dim">/ {{ s.votesTotal ?? 0 }} total</span>
                </div>
                <div class="w-28 shrink-0 text-sm font-semibold" :class="s.status === 'online' ? 'text-online' : 'text-dim'">
                    <template v-if="s.status === 'online'">{{ typeof s.players === 'number' && typeof s.capacity === 'number' ? `${s.players} / ${s.capacity}` : 'Online' }}</template>
                    <template v-else>Offline</template>
                </div>
                <div class="flex shrink-0 gap-2">
                    <NuxtLink :to="`/your-servers/${s.id}`" class="btn-ghost py-2"><Icon name="heroicons-outline:pencil-square" class="h-4 w-4" />Edit</NuxtLink>
                    <button type="button" class="btn-ghost py-2 text-danger" :disabled="deletingId === s.id" @click="onDelete(s)"><Icon name="heroicons-outline:trash" class="h-4 w-4" />{{ deletingId === s.id ? 'Deleting…' : 'Delete' }}</button>
                </div>
            </li>
        </ul>
    </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { countryFlagUrl as countryFlag } from "~/utils/countries";

definePageMeta({ middleware: "auth" });
useHead({ title: "Your servers — HyList" });

const toast = useAppToast();
const { ask } = useConfirm();

type MyServer = {
    id: string;
    name: string;
    description?: string;
    host: string;
    port: number;
    country: string;
    tags: string[];
    verificationToken: string;
    createdAt: number;
    lastSeenAt?: number;
    capacity?: number;
    players?: number;
    status?: "online" | "offline";
    logoUrl?: string;
    votesMonth?: number;
    votesTotal?: number;
};

const route = useRoute();

const notice = ref<string | null>(null);
watch(
    () => route.query,
    () => {
        const addedName = String(route.query.addedName || "");
        if (addedName) notice.value = `Added “${addedName}” to your servers.`;
    },
    { immediate: true },
);

const { data, pending, error, refresh } = await useFetch<{
    servers: MyServer[];
}>("/api/servers/mine?detailed=true");
const servers = computed(() => data.value?.servers ?? []);
const deletingId = ref<string | null>(null);
const brokenLogos = ref<Record<string, boolean>>({});


function initial(name: string) {
    const v = String(name || "").trim();
    return (v[0] || "S").toUpperCase();
}


function dismissNotice() {
    notice.value = null;
    const q = { ...route.query };
    delete (q as any).added;
    delete (q as any).addedName;
    navigateTo({ path: "/your-servers", query: q }, { replace: true });
}

async function onDelete(s: MyServer) {
    const ok = await ask({ title: `Delete “${s.name}”?`, message: "The listing, its votes, logo and banner will be removed. This can't be undone.", confirmText: "Delete server", danger: true });
    if (!ok) return;
    deletingId.value = s.id;
    try {
        await $fetch(`/api/servers/${s.id}`, { method: "DELETE" });
        toast.success("Server deleted");
        await refresh();
    } catch (e: any) {
        toast.error(e?.data?.message || "Failed to delete server");
    } finally {
        deletingId.value = null;
    }
}
</script>