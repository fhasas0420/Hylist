<template>
    <section class="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6">
        <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
                <h1 class="text-[28px] font-bold leading-tight tracking-tight">Reports</h1>
                <p class="mt-2 text-sm text-muted">Listings reported by players.</p>
            </div>
            <NuxtLink to="/admin" class="text-sm text-muted hover:text-ink">← Admin panel</NuxtLink>
        </div>

        <div class="mt-6 flex rounded-lg border border-line-strong p-0.5 text-sm sm:w-fit">
            <button v-for="t in (['open', 'closed'] as const)" :key="t" type="button" class="flex-1 cursor-pointer rounded-md px-4 py-1.5 font-medium sm:flex-none" :class="status === t ? 'bg-raised text-ink' : 'text-muted hover:text-ink'" @click="status = t">
                {{ t === "open" ? `Open${data?.openCount ? ` (${data.openCount})` : ""}` : "Closed" }}
            </button>
        </div>

        <div v-if="pending" class="panel mt-5 h-40 animate-pulse" />
        <div v-else-if="error" class="panel mt-5 p-6 text-sm text-danger">Couldn't load reports.</div>
        <div v-else-if="!data?.reports.length" class="panel mt-5 p-10 text-center text-sm text-muted">
            {{ status === "open" ? "No open reports." : "No closed reports yet." }}
        </div>
        <ul v-else class="panel mt-5 divide-y divide-line">
            <li v-for="r in data.reports" :key="r.id" class="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                <div class="min-w-0 flex-1">
                    <p class="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span class="rounded-md bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger">{{ r.reasonLabel }}</span>
                        <NuxtLink :to="`/server/${r.server.id}`" class="font-semibold hover:text-accent">{{ r.server.name }}</NuxtLink>
                        <span class="font-mono text-xs text-dim">{{ r.server.address }}</span>
                    </p>
                    <p v-if="r.details" class="mt-2 whitespace-pre-line text-sm text-muted">{{ r.details }}</p>
                    <p class="mt-2 text-xs text-dim">
                        By {{ r.reporter }} · {{ fmt(r.createdAt) }}
                        <template v-if="r.resolvedAt"> · {{ r.resolution === "resolved" ? "Resolved" : "Dismissed" }} {{ fmt(r.resolvedAt) }}</template>
                    </p>
                </div>
                <div class="flex shrink-0 flex-wrap gap-2">
                    <template v-if="!r.resolvedAt">
                        <NuxtLink :to="`/admin/servers/${r.server.id}`" class="btn-ghost py-2"><Icon name="heroicons-outline:pencil-square" class="h-4 w-4" />Edit</NuxtLink>
                        <button type="button" class="btn-ghost py-2" :disabled="busyId === r.id" @click="act(r.id, 'resolved')"><Icon name="heroicons-outline:check" class="h-4 w-4" />Resolved</button>
                        <button type="button" class="btn-ghost py-2 text-muted" :disabled="busyId === r.id" @click="act(r.id, 'dismissed')">Dismiss</button>
                        <button type="button" class="btn-ghost py-2 text-danger" :disabled="busyId === r.id" @click="removeServer(r)"><Icon name="heroicons-outline:trash" class="h-4 w-4" />Delete server</button>
                    </template>
                    <button v-else type="button" class="btn-ghost py-2" :disabled="busyId === r.id" @click="act(r.id, 'reopen')">Reopen</button>
                </div>
            </li>
        </ul>
    </section>
</template>

<script setup lang="ts">
import { ref } from "vue";

definePageMeta({ middleware: "admin" });
useHead({ title: "Reports — HyList" });

type AdminReport = {
    id: string;
    reason: string;
    reasonLabel: string;
    details: string | null;
    createdAt: number;
    resolvedAt: number | null;
    resolution: string | null;
    reporter: string;
    server: { id: string; name: string; address: string };
};

const toast = useAppToast();
const { ask } = useConfirm();
const status = ref<"open" | "closed">("open");
const { data, pending, error, refresh } = await useFetch<{ openCount: number; reports: AdminReport[] }>("/api/admin/reports", { query: { status } });
const busyId = ref<string | null>(null);

const fmt = (t: number) => new Date(t).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

async function act(id: string, action: "resolved" | "dismissed" | "reopen") {
    busyId.value = id;
    try {
        await $fetch(`/api/admin/reports/${id}`, { method: "PATCH", body: { action } });
        await refresh();
    } catch (e: any) {
        toast.error(e?.data?.message || "Failed to update report");
    } finally {
        busyId.value = null;
    }
}

async function removeServer(r: AdminReport) {
    const ok = await ask({ title: `Delete “${r.server.name}”?`, message: `${r.server.address} will be removed with its votes, logo, banner and reports. This can't be undone.`, confirmText: "Delete server", danger: true });
    if (!ok) return;
    busyId.value = r.id;
    try {
        await $fetch(`/api/admin/servers/${r.server.id}`, { method: "DELETE" });
        toast.success("Server deleted");
        await refresh();
    } catch (e: any) {
        toast.error(e?.data?.message || "Failed to delete server");
    } finally {
        busyId.value = null;
    }
}
</script>
