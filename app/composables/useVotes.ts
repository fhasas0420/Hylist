export function useVotes() {
    const nextVote = useState<Record<string, number>>("votes:next", () => ({}));
    const loadedFor = useState<string | null>("votes:loadedFor", () => null);
    const { user } = useAuth();

    async function load(force = false) {
        const who = user.value?.id || "anon";
        if (!import.meta.client || (loadedFor.value === who && !force)) return;
        loadedFor.value = who;
        try {
            const res = await $fetch<{ votes: Record<string, number> }>("/api/votes/mine");
            nextVote.value = res.votes || {};
        } catch {
            nextVote.value = {};
        }
    }

    function nextVoteAt(serverId: string): number | null {
        const t = nextVote.value[serverId];
        return t && t > Date.now() ? t : null;
    }

    const route = useRoute();
    const { askText } = useConfirm();

    async function vote(server: { id: string; name: string; voteRewards?: boolean }): Promise<{ month: number; total: number }> {
        if (!user.value) {
            await navigateTo({ path: "/auth/login", query: { next: route.fullPath } });
            throw new Error("login required");
        }
        const serverId = server.id;
        let playerName: string | undefined;
        if (server.voteRewards) {
            let saved = "";
            try {
                saved = localStorage.getItem("hylist:playerName") || "";
            } catch { }
            const name = await askText({
                title: `Vote for ${server.name}`,
                message: "This server gives in-game rewards for votes. Enter your Hytale username to receive them.",
                confirmText: "Vote",
                input: { label: "Hytale username", placeholder: "YourName", value: saved, hint: "3–16 letters, digits or _. Leave empty to vote without a reward.", maxlength: 16 },
            });
            if (name === null) throw new Error("cancelled");
            playerName = name || undefined;
            try {
                if (name) localStorage.setItem("hylist:playerName", name);
            } catch { }
        }
        try {
            const res = await $fetch<{ votes: { month: number; total: number }; nextVoteAt: number }>(`/api/servers/${serverId}/vote`, { method: "POST", body: { playerName } });
            nextVote.value = { ...nextVote.value, [serverId]: res.nextVoteAt };
            return res.votes;
        } catch (e: any) {
            const next = e?.data?.data?.nextVoteAt ?? e?.data?.nextVoteAt;
            if (next) nextVote.value = { ...nextVote.value, [serverId]: next };
            throw e;
        }
    }

    function autoLoad() {
        onMounted(() => load());
        watch(() => user.value?.id, () => load());
    }

    return { load, autoLoad, vote, nextVoteAt };
}

export function formatWait(ms: number): string {
    const m = Math.max(1, Math.ceil(ms / 60000));
    const h = Math.floor(m / 60);
    return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
}
