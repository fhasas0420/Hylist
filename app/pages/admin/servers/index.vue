<template>
    <section class="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6">
        <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between gap-4">
                <h1 class="text-[28px] font-bold leading-tight tracking-tight">Servers</h1>
                <NuxtLink to="/admin" class="text-sm text-muted hover:text-ink">← Admin panel</NuxtLink>
            </div>
            <p class="text-sm text-muted">Feature, edit, or remove servers.</p>
        </div>

        <div class="mt-6 panel p-4">
            <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div class="flex-1">
                    <label class="label">Search</label>
                    <input v-model="search" type="search" placeholder="Name, host, owner…" class="field mt-2" />
                </div>
                <button type="button" class="btn-ghost md:mt-6" :disabled="pending" @click="refresh()">
                    Refresh
                </button>
            </div>
        </div>

        <div class="mt-6">
            <div v-if="pending" class="panel p-6 text-muted">Loading…</div>
            <div v-else-if="error" class="panel p-6 text-danger">Failed to load servers.</div>

            <div v-else class="panel overflow-hidden">
                <div class="overflow-auto">
                    <table class="min-w-full text-left text-sm">
                        <thead class="border-b border-line text-xs uppercase tracking-wider text-dim">
                            <tr>
                                <th class="px-4 py-3">Server</th>
                                <th class="px-4 py-3">Owner</th>
                                <th class="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="s in filtered" :key="s.id" class="border-t border-line">
                                <td class="px-4 py-3">
                                    <div class="flex flex-col">
                                        <div class="flex items-center gap-2">
                                            <p class="font-semibold text-ink">{{ s.name }}</p>
                                            <span v-if="s.isFeatured" class="text-[10px] font-bold tracking-wider text-accent">FEATURED</span>
                                        </div>
                                        <p class="text-xs text-dim">{{ s.host }}:{{ s.port }} • {{ s.country }}</p>
                                    </div>
                                </td>
                                <td class="px-4 py-3">
                                    <p class="text-ink">{{ s.ownerDisplayName || "—" }}</p>
                                </td>
                                <td class="px-4 py-3">
                                    <div class="flex items-center justify-end gap-2">
                                        <NuxtLink :to="`/admin/servers/${s.id}`" class="btn-ghost py-2">
                                            <Icon name="heroicons-outline:pencil-square" class="h-4 w-4" />Edit
                                        </NuxtLink>

                                        <button type="button" class="btn-ghost py-2 text-danger" :disabled="deletingId === s.id" @click="remove(s)">
<Icon name="heroicons-outline:trash" class="h-4 w-4" />
                                            {{ deletingId === s.id ? "Deleting…" : "Delete" }}
                                        </button>
                                    </div>
                                </td>
                            </tr>

                            <tr v-if="filtered.length === 0">
                                <td colspan="3" class="px-4 py-8 text-center text-muted">No servers match your search.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

definePageMeta({ middleware: "admin" });
useHead({ title: "Admin Servers — HyList" });
const toast = useAppToast();
const { ask } = useConfirm();

type AdminServer = {
    id: string;
    name: string;
    description?: string;
    host: string;
    port: number;
    country: string;
    tags: string[];
    createdAt: number | null;
    createdByUserId: string | null;
    ownerDisplayName: string | null;
    ownerRole: string | null;
    lastSeenAt: number | null;
    isFeatured: boolean;
};

const search = ref("");
const deletingId = ref<string | null>(null);

const { data, pending, error, refresh } = await useFetch<{
    servers: AdminServer[];
}>("/api/admin/servers");
const servers = computed(() => data.value?.servers ?? []);

const filtered = computed(() => {
    const q = search.value.trim().toLowerCase();
    if (!q) return servers.value;

    return servers.value.filter((s) => {
        const hay =
            `${s.name} ${s.host}:${s.port} ${s.ownerDisplayName || ""}`.toLowerCase();
        return hay.includes(q);
    });
});

async function remove(s: AdminServer) {
    const ok = await ask({ title: `Delete “${s.name}”?`, message: `${s.host}:${s.port} will be removed with its votes, logo and banner. This can't be undone.`, confirmText: "Delete server", danger: true });
    if (!ok) return;
    deletingId.value = s.id;
    try {
        await $fetch(`/api/admin/servers/${s.id}`, { method: "DELETE" });
        toast.success("Server is deleted!");
        await refresh();
    } catch (e: any) {
        toast.error("Failed to delete server!");
    } finally {
        deletingId.value = null;
    }
}
</script>