<template>
    <footer class="border-t border-line">
        <div class="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-dim sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p><span class="font-semibold text-muted">HyList</span> · Hytale server list · © {{ year }}</p>
            <nav class="flex gap-5">
                <NuxtLink to="/" class="hover:text-ink">Servers</NuxtLink>
                <NuxtLink to="/find" class="hover:text-ink">Search</NuxtLink>
                <NuxtLink to="/add" class="hover:text-ink">Add server</NuxtLink>
            </nav>
        </div>
        <p class="mx-auto max-w-6xl px-4 pb-8 text-xs text-dim sm:px-6">Not affiliated with Hypixel Studios. Hytale is a trademark of Hypixel Studios.</p>
    </footer>
</template>

<script setup lang="ts">
const year = new Date().getFullYear();
</script>
