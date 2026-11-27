<template>
    <div class="flex items-center gap-3 py-3">
        <NuxtLink :to="`/server/${server.id}`" class="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-line-strong">
            <img v-if="server.logoUrl" :src="server.logoUrl" alt="" class="h-full w-full object-cover" />
            <span v-else class="grid h-full w-full place-items-center text-sm font-semibold text-muted">{{ (server.name?.trim()?.[0] || "S").toUpperCase() }}</span>
        </NuxtLink>
        <div class="min-w-0 flex-1">
            <p class="flex items-center gap-1.5">
                <NuxtLink :to="`/server/${server.id}`" class="truncate font-semibold hover:text-accent">{{ server.name }}</NuxtLink>
                <Icon v-if="server.verified" name="heroicons-outline:check-badge" class="h-4 w-4 shrink-0 text-accent" />
            </p>
            <p class="mt-0.5 flex flex-wrap gap-x-2 text-xs text-dim">
                <span :class="server.online ? 'text-online' : ''">● {{ server.online ? (typeof server.players === "number" ? `${server.players}${typeof server.capacity === "number" ? `/${server.capacity}` : ""}` : "Online") : "Offline" }}</span>
                <span v-if="server.rank">#{{ server.rank }}</span>
                <span>{{ server.votesMonth }} {{ server.votesMonth === 1 ? "vote" : "votes" }} this month</span>
                <span v-if="detailed">· {{ server.votesTotal }} all time</span>
            </p>
        </div>
        <NuxtLink :to="`/your-servers/${server.id}`" class="btn-ghost shrink-0 px-3 py-1.5 text-xs"><Icon name="heroicons-outline:pencil-square" class="h-3.5 w-3.5" />Edit</NuxtLink>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    server: { id: string; name: string; logoUrl?: string; online: boolean; players?: number; capacity?: number; rank: number | null; verified: boolean; votesMonth: number; votesTotal: number };
    detailed?: boolean;
}>();
</script>
