<template>
    <ConfirmModal v-if="state" @close="answer(null)">
        <template #title>
            <p class="flex items-center gap-2 font-semibold">
                <Icon v-if="state.danger" name="heroicons-outline:exclamation" class="h-5 w-5 shrink-0 text-danger" />
                {{ state.title }}
            </p>
        </template>
        <template #content>
            <p v-if="state.message" class="text-sm leading-relaxed text-muted">{{ state.message }}</p>
            <form v-if="state.input" :class="state.message && 'mt-4'" @submit.prevent="answer(text.trim())">
                <label class="label" for="confirm-input">{{ state.input.label }}</label>
                <input id="confirm-input" ref="inputEl" v-model="text" type="text" class="field mt-1.5" :placeholder="state.input.placeholder" :maxlength="state.input.maxlength || 200" autocomplete="off" />
                <p v-if="state.input.hint" class="mt-1.5 text-xs text-dim">{{ state.input.hint }}</p>
            </form>
        </template>
        <template #footer>
            <div class="flex justify-end gap-2">
                <button type="button" class="btn-ghost" @click="answer(null)">Cancel</button>
                <button type="button" :class="state.danger ? 'btn-danger' : 'btn-primary'" @click="answer(state.input ? text.trim() : '')">{{ state.confirmText || "Confirm" }}</button>
            </div>
        </template>
    </ConfirmModal>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from "vue";

const { state, answer } = useConfirm();
const text = ref("");
const inputEl = ref<HTMLInputElement | null>(null);

watch(state, async (s) => {
    text.value = s?.input?.value ?? "";
    if (s?.input) {
        await nextTick();
        setTimeout(() => inputEl.value?.focus(), 30);
    }
});
</script>
