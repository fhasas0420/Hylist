<template>
    <div class="panel p-6">
        <h2 class="text-[15px] font-semibold">Badge</h2>
        <p class="mt-1 text-sm text-muted">Put it on your website or forum post. It shows your rank, status and votes, and links to your HyList page.</p>
        <img :src="`/badge/${serverId}.svg`" alt="HyList badge" class="mt-3 h-12 w-auto max-w-full" />
        <div class="mt-3 flex rounded-lg border border-line-strong p-0.5 text-xs">
            <button v-for="f in FORMATS" :key="f" type="button" class="flex-1 cursor-pointer rounded-md px-2 py-1 font-medium" :class="format === f ? 'bg-raised text-ink' : 'text-muted hover:text-ink'" @click="format = f">{{ f }}</button>
        </div>
        <button type="button" class="mt-2 w-full cursor-pointer break-all rounded-lg border border-line-strong bg-field p-2.5 text-left font-mono text-[11px] leading-relaxed text-muted hover:border-accent" title="Click to copy" @click="copy">{{ code }}</button>
        <p class="mt-1.5 text-xs" :class="copied ? 'text-online' : 'text-dim'">{{ copied ? "Copied" : "Click the code to copy it. Updates every 5 minutes." }}</p>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

const props = defineProps<{ serverId: string; serverName: string }>();

const FORMATS = ["HTML", "Markdown", "BBCode", "Image URL"] as const;
const format = ref<(typeof FORMATS)[number]>("HTML");
const origin = useRequestURL().origin;

const code = computed(() => {
    const img = `${origin}/badge/${props.serverId}.svg`;
    const link = `${origin}/server/${props.serverId}`;
    if (format.value === "Markdown") return `[![${props.serverName} on HyList](${img})](${link})`;
    if (format.value === "BBCode") return `[url=${link}][img]${img}[/img][/url]`;
    if (format.value === "Image URL") return img;
    return `<a href="${link}"><img src="${img}" alt="${props.serverName.replace(/"/g, "&quot;")} on HyList" width="320" height="64"></a>`;
});

const copied = ref(false);
async function copy() {
    await navigator.clipboard.writeText(code.value).catch(() => null);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
}
</script>
