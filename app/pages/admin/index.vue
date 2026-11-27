<template>
    <section class="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6">
        <h1 class="text-[28px] font-bold leading-tight tracking-tight">Admin panel</h1>
        <p class="mt-2 text-sm text-muted">Manage listings, featured placements, roles, VIP and reports.</p>

        <div class="mt-7 grid gap-4 sm:grid-cols-3">
            <NuxtLink to="/admin/servers" class="panel group p-5 transition-colors hover:border-line-strong">
                <p class="flex items-center gap-2 font-semibold group-hover:text-accent"><Icon name="heroicons-outline:server-stack" class="h-4 w-4" />Servers</p>
                <p class="mt-1 text-sm text-muted">Edit, feature or remove any server.</p>
            </NuxtLink>
            <NuxtLink to="/admin/users" class="panel group p-5 transition-colors hover:border-line-strong">
                <p class="flex items-center gap-2 font-semibold group-hover:text-accent"><Icon name="heroicons-outline:users" class="h-4 w-4" />Users</p>
                <p class="mt-1 text-sm text-muted">Change roles and give VIP with an end date.</p>
            </NuxtLink>
            <NuxtLink to="/admin/reports" class="panel group p-5 transition-colors hover:border-line-strong">
                <p class="flex items-center gap-2 font-semibold group-hover:text-accent">
                    <Icon name="heroicons-outline:flag" class="h-4 w-4" />Reports
                    <span v-if="openCount" class="ml-auto rounded-md bg-danger/15 px-2 py-0.5 font-mono text-xs text-danger">{{ openCount }} open</span>
                </p>
                <p class="mt-1 text-sm text-muted">Listings reported by players.</p>
            </NuxtLink>
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

definePageMeta({ middleware: "admin" });
useHead({ title: "Admin — HyList" });

const { data } = await useFetch<{ openCount: number }>("/api/admin/reports", { query: { status: "open" }, pick: ["openCount"] });
const openCount = computed(() => data.value?.openCount ?? 0);
</script>
