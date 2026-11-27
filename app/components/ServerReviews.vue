<template>
    <div class="panel p-5 sm:p-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-[15px] font-semibold">Reviews</h2>
            <button v-if="canWrite && !editing" type="button" class="btn-ghost py-2" @click="startEdit"><Icon name="heroicons-outline:pencil-square" class="h-4 w-4" />{{ data?.mine ? "Edit your review" : "Write a review" }}</button>
        </div>

        <div v-if="data?.summary.count" class="mt-4 grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
            <div class="text-center sm:pr-4">
                <p class="text-4xl font-bold">{{ data.summary.avg.toFixed(1) }}</p>
                <Stars :value="data.summary.avg" size="md" class="mt-1" />
                <p class="mt-1 text-xs text-dim">{{ data.summary.count }} {{ data.summary.count === 1 ? "review" : "reviews" }}</p>
            </div>
            <div class="space-y-1">
                <div v-for="b in data.breakdown" :key="b.stars" class="flex items-center gap-2 text-xs">
                    <span class="w-3 text-right font-mono text-dim">{{ b.stars }}</span>
                    <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-raised"><div class="h-full rounded-full bg-vip" :style="{ width: `${(b.count / data.summary.count) * 100}%` }" /></div>
                    <span class="w-6 font-mono text-dim">{{ b.count }}</span>
                </div>
            </div>
        </div>

        <form v-if="editing" class="mt-5 rounded-lg border border-line-strong bg-field p-4" @submit.prevent="submit">
            <p class="label">Your rating</p>
            <Stars v-model="draftRating" interactive size="lg" class="mt-2" />
            <label class="label mt-4 block" for="review-body">Your review</label>
            <textarea id="review-body" v-model="draftBody" rows="4" maxlength="1000" class="field mt-1.5 resize-y" placeholder="What is the server like? Community, staff, performance, game modes…" />
            <p class="mt-1 flex justify-between text-xs text-dim"><span>At least 10 characters.</span><span>{{ draftBody.length }}/1000</span></p>
            <p v-if="formError" class="mt-2 text-sm text-danger">{{ formError }}</p>
            <div class="mt-3 flex justify-end gap-2">
                <button type="button" class="btn-ghost py-2" :disabled="saving" @click="editing = false">Cancel</button>
                <button type="submit" class="btn-primary py-2" :disabled="saving || !draftRating">{{ saving ? "Saving…" : data?.mine ? "Update review" : "Post review" }}</button>
            </div>
        </form>

        <p v-if="!user && !data?.summary.count" class="mt-3 text-sm text-muted">No reviews yet. <NuxtLink :to="{ path: '/auth/login', query: { next: route.fullPath } }" class="text-accent hover:underline">Log in</NuxtLink> to write the first one.</p>
        <p v-else-if="!user" class="mt-4 text-sm text-muted"><NuxtLink :to="{ path: '/auth/login', query: { next: route.fullPath } }" class="text-accent hover:underline">Log in</NuxtLink> to write a review.</p>
        <p v-else-if="isOwner && !data?.summary.count" class="mt-3 text-sm text-muted">No reviews yet. Players can review your server here.</p>
        <p v-else-if="!data?.summary.count && !editing" class="mt-3 text-sm text-muted">No reviews yet. Be the first to write one.</p>

        <ul v-if="data?.reviews.length" class="mt-5 divide-y divide-line border-t border-line">
            <li v-for="r in data.reviews" :key="r.id" class="py-4">
                <div class="flex items-center gap-3">
                    <span class="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-raised text-xs font-semibold text-muted">
                        <img v-if="r.author.avatarUrl" :src="r.author.avatarUrl" alt="" class="h-full w-full object-cover" />
                        <template v-else>{{ (r.author.name[0] || "M").toUpperCase() }}</template>
                    </span>
                    <div class="min-w-0 flex-1">
                        <p class="truncate text-sm font-medium"><NuxtLink :to="`/u/${r.author.id}`" class="hover:text-accent">{{ r.author.name }}</NuxtLink><span v-if="r.mine" class="ml-1.5 text-xs font-normal text-accent">you</span></p>
                        <p class="flex items-center gap-2 text-xs text-dim"><Stars :value="r.rating" />{{ fmt(r.createdAt) }}<template v-if="r.edited"> · edited</template></p>
                    </div>
                    <button v-if="r.mine || data.canModerate" type="button" class="cursor-pointer text-xs text-dim hover:text-danger" :disabled="deletingId === r.id" @click="remove(r)">{{ r.mine ? "Delete" : "Remove" }}</button>
                </div>
                <p class="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">{{ r.body }}</p>
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

type Review = { id: string; rating: number; body: string; createdAt: number; edited: boolean; author: { id: string; name: string; avatarUrl: string | null }; mine: boolean };
type ReviewsResponse = { summary: { avg: number; count: number }; breakdown: { stars: number; count: number }[]; reviews: Review[]; mine: Review | null; canModerate: boolean };

const props = defineProps<{ serverId: string; isOwner: boolean }>();
const emit = defineEmits<{ (e: "changed"): void }>();

const route = useRoute();
const toast = useAppToast();
const { user } = useAuth();
const { ask } = useConfirm();

const { data, refresh } = await useFetch<ReviewsResponse>(() => `/api/servers/${props.serverId}/reviews`);
const canWrite = computed(() => Boolean(user.value) && !props.isOwner);

const editing = ref(false);
const draftRating = ref(0);
const draftBody = ref("");
const formError = ref<string | null>(null);
const saving = ref(false);
const deletingId = ref<string | null>(null);

function startEdit() {
    draftRating.value = data.value?.mine?.rating ?? 0;
    draftBody.value = data.value?.mine?.body ?? "";
    formError.value = null;
    editing.value = true;
}

async function submit() {
    saving.value = true;
    formError.value = null;
    try {
        await $fetch(`/api/servers/${props.serverId}/reviews`, { method: "POST", body: { rating: draftRating.value, body: draftBody.value } });
        editing.value = false;
        toast.success(data.value?.mine ? "Review updated" : "Review posted");
        await refresh();
        emit("changed");
    } catch (e: any) {
        formError.value = e?.data?.message || "Couldn't save the review";
    } finally {
        saving.value = false;
    }
}

async function remove(r: Review) {
    const ok = await ask({ title: r.mine ? "Delete your review?" : `Remove ${r.author.name}'s review?`, confirmText: r.mine ? "Delete" : "Remove", danger: true });
    if (!ok) return;
    deletingId.value = r.id;
    try {
        await $fetch(`/api/reviews/${r.id}`, { method: "DELETE" });
        await refresh();
        emit("changed");
    } catch (e: any) {
        toast.error(e?.data?.message || "Couldn't delete the review");
    } finally {
        deletingId.value = null;
    }
}

const fmt = (t: number) => new Date(t).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
</script>
