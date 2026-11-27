<template>
    <button type="button" class="group inline-flex min-w-0 cursor-pointer items-center gap-2 rounded-lg border border-line-strong bg-field text-left transition-colors hover:border-accent" :class="large ? 'px-3.5 py-2.5' : 'px-2.5 py-2'" :title="copied ? 'Copied' : 'Copy IP'" @click="copy">
        <Icon name="heroicons-outline:globe-alt" class="h-4 w-4 shrink-0 text-dim" />
        <span class="min-w-0 flex-1 truncate font-mono" :class="large ? 'text-sm' : 'text-xs'">{{ ip }}</span>
        <Icon :name="copied ? 'heroicons-outline:check' : 'heroicons-outline:clipboard-document'" class="h-4 w-4 shrink-0" :class="copied ? 'text-online' : 'text-dim group-hover:text-ink'" />
    </button>
</template>

<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{ ip: string; large?: boolean }>();
const copied = ref(false);
let timer: ReturnType<typeof setTimeout> | null = null;

async function copy() {
    try {
        await navigator.clipboard.writeText(props.ip);
    } catch {
        const el = document.createElement("textarea");
        el.value = props.ip;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
    }
    copied.value = true;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => (copied.value = false), 2000);
}
</script>
