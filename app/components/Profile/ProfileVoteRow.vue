<template>
    <div class="flex items-center gap-3 py-3">
        <NuxtLink :to="`/server/${vote.server.id}`" class="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-line-strong">
            <img v-if="vote.server.logoUrl" :src="vote.server.logoUrl" alt="" class="h-full w-full object-cover" />
            <span v-else class="grid h-full w-full place-items-center text-sm font-semibold text-muted">{{ (vote.server.name?.trim()?.[0] || "S").toUpperCase() }}</span>
        </NuxtLink>
        <div class="min-w-0 flex-1">
            <NuxtLink :to="`/server/${vote.server.id}`" class="block truncate text-sm font-medium hover:text-accent">{{ vote.server.name }}</NuxtLink>
            <p v-if="!compact" class="mt-0.5 text-xs text-dim">{{ vote.count }} {{ vote.count === 1 ? "vote" : "votes" }} · last {{ new Date(vote.lastVotedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) }}</p>
        </div>
        <VoteButton :server="vote.server" />
    </div>
</template>

<script setup lang="ts">
defineProps<{
    vote: { server: { id: string; name: string; logoUrl?: string; online: boolean; voteRewards?: boolean; votesMonth: number }; count: number; lastVotedAt: number; nextVoteAt: number | null };
    compact?: boolean;
}>();
</script>
