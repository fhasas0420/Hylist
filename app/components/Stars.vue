<template>
    <div class="inline-flex items-center" :class="gapClass" role="img" :aria-label="interactive ? undefined : `${value} out of 5 stars`" @mouseleave="hover = 0">
        <component :is="interactive ? 'button' : 'span'" v-for="n in 5" :key="n" :type="interactive ? 'button' : undefined" class="relative block" :class="[sizeClass, interactive && 'cursor-pointer']" :aria-label="interactive ? `${n} star${n > 1 ? 's' : ''}` : undefined" @mouseenter="interactive && (hover = n)" @click="interactive && emit('update:modelValue', n)">
            <svg viewBox="0 0 20 20" class="absolute inset-0 h-full w-full text-line-strong" fill="currentColor"><path :d="STAR" /></svg>
            <span class="absolute inset-0 overflow-hidden" :style="{ width: `${fill(n) * 100}%` }">
                <svg viewBox="0 0 20 20" class="h-full text-vip" :class="sizeClass" fill="currentColor"><path :d="STAR" /></svg>
            </span>
        </component>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

const props = withDefaults(defineProps<{ value?: number; modelValue?: number; interactive?: boolean; size?: "sm" | "md" | "lg" }>(), { value: 0, modelValue: 0, interactive: false, size: "sm" });
const emit = defineEmits<{ (e: "update:modelValue", v: number): void }>();

const STAR = "M10 1.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6L10 15l-5.4 3 1.2-6L1.3 7.8l6.1-.7L10 1.5z";
const hover = ref(0);
const current = computed(() => (props.interactive ? hover.value || props.modelValue : props.value));
const fill = (n: number) => Math.max(0, Math.min(1, current.value - (n - 1)));
const sizeClass = computed(() => ({ sm: "h-3.5 w-3.5", md: "h-4.5 w-4.5", lg: "h-7 w-7" })[props.size]);
const gapClass = computed(() => (props.size === "lg" ? "gap-1" : "gap-0.5"));
</script>
