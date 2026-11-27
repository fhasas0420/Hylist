<template>
    <button type="button" class="inline-flex shrink-0 cursor-pointer whitespace-nowrap items-center justify-center gap-1.5 rounded-lg font-semibold transition-colors disabled:cursor-default" :class="[large ? 'px-5 py-2.5 text-[15px]' : 'px-3 py-2 text-sm', waitMs ? 'border border-line-strong text-muted' : 'bg-accent text-accent-ink hover:bg-accent-hover']" :disabled="voting || !!waitMs" :title="waitMs ? `You can vote again in ${formatWait(waitMs)}` : 'Vote for this server'" @click="onVote">
        <Icon :name="waitMs ? 'heroicons-outline:check' : 'heroicons-outline:chevron-double-up'" class="h-4 w-4" />
        <span>{{ waitMs ? (large ? `Voted · ${formatWait(waitMs)}` : "Voted") : "Vote" }}</span>
        <span v-if="!large" class="font-mono text-xs opacity-80">{{ count }}</span>
    </button>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { formatWait } from "~/composables/useVotes";

const props = defineProps<{
    server: { id: string; name: string; voteRewards?: boolean; votesMonth?: number };
    large?: boolean;
}>();
const emit = defineEmits<{ (e: "voted", counts: { month: number; total: number }): void }>();

const toast = useAppToast();
const { vote, nextVoteAt } = useVotes();

const count = ref(props.server.votesMonth ?? 0);
watch(() => props.server.votesMonth, (v) => (count.value = v ?? 0));

const voting = ref(false);
const now = ref(Date.now());
let tick: ReturnType<typeof setInterval> | null = null;
onMounted(() => (tick = setInterval(() => (now.value = Date.now()), 30000)));
onBeforeUnmount(() => tick && clearInterval(tick));

const waitMs = computed(() => {
    const t = nextVoteAt(props.server.id);
    return t ? Math.max(0, t - now.value) : 0;
});

async function onVote() {
    if (voting.value || waitMs.value) return;
    voting.value = true;
    try {
        const counts = await vote(props.server);
        count.value = counts.month;
        emit("voted", counts);
        toast.success(`Voted for ${props.server.name}`);
    } catch (e: any) {
        if (e?.message !== "login required" && e?.message !== "cancelled") toast.error(e?.data?.message || "Couldn't vote, try again");
    } finally {
        now.value = Date.now();
        voting.value = false;
    }
}
</script>
