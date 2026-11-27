<template>
    <div class="mx-auto w-full max-w-sm">
        <h1 class="text-2xl font-bold tracking-tight">{{ title }}</h1>
        <p v-if="subtitle" class="mt-1.5 text-sm text-muted">{{ subtitle }}</p>
        <div class="panel mt-6 p-5">
            <slot />
        </div>
        <p v-if="$slots.below" class="mt-5 text-center text-sm text-muted">
            <slot name="below" />
        </p>
    </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>();
</script>
