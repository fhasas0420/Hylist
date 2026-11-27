<template>
    <header class="sticky top-0 z-50 border-b border-line bg-nav">
        <nav class="mx-auto flex h-16 max-w-6xl items-center gap-8 px-4 sm:px-6">
            <NuxtLink to="/" class="flex items-center gap-2 text-[19px] font-bold tracking-tight text-ink">
                <Icon name="heroicons-outline:cube" class="h-6 w-6 text-accent" />
                HyList
            </NuxtLink>

            <div class="hidden items-center gap-6 md:flex">
                <NuxtLink v-for="l in links" :key="l.to" :to="l.to" class="inline-flex items-center gap-1.5 text-sm font-medium transition-colors" :class="isActive(l.to) ? 'text-ink' : 'text-muted hover:text-ink'">
                    <Icon :name="l.icon" class="h-4 w-4" />
                    {{ l.label }}
                </NuxtLink>
            </div>

            <div class="ml-auto flex items-center gap-3">
                <template v-if="user">
                    <div ref="menuRef" class="relative">
                        <button type="button" class="flex cursor-pointer items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-2.5 transition-colors hover:bg-raised" :aria-expanded="menuOpen" @click.stop="menuOpen = !menuOpen">
                            <img v-if="user.avatarUrl" :src="user.avatarUrl" alt="" class="h-7 w-7 rounded-md object-cover" />
                            <span v-else class="grid h-7 w-7 place-items-center rounded-md bg-raised text-xs font-semibold text-ink">{{ initial }}</span>
                            <span class="hidden max-w-40 truncate text-sm text-ink sm:inline">{{ user.displayName }}</span>
                            <Icon name="heroicons-outline:chevron-down" class="h-4 w-4 text-muted" />
                        </button>

                        <div v-show="menuOpen" class="absolute right-0 mt-2 w-52 overflow-hidden rounded-[10px] border border-line-strong bg-surface py-1.5 shadow-lg shadow-black/30">
                            <NuxtLink v-if="user.role === 'admin'" to="/admin" class="menu-item" @click="menuOpen = false"><Icon name="heroicons-outline:shield-check" class="h-4 w-4 text-muted" />Admin panel</NuxtLink>
                            <NuxtLink to="/your-servers" class="menu-item" @click="menuOpen = false"><Icon name="heroicons-outline:server-stack" class="h-4 w-4 text-muted" />Your servers</NuxtLink>
                            <NuxtLink to="/profile" class="menu-item" @click="menuOpen = false"><Icon name="heroicons-outline:user-circle" class="h-4 w-4 text-muted" />Profile</NuxtLink>
                            <NuxtLink to="/settings" class="menu-item" @click="menuOpen = false"><Icon name="heroicons-outline:cog-6-tooth" class="h-4 w-4 text-muted" />Settings</NuxtLink>
                            <div class="my-1.5 border-t border-line" />
                            <button type="button" class="menu-item w-full text-left text-danger" @click="onLogout"><Icon name="heroicons-outline:arrow-right-on-rectangle" class="h-4 w-4" />Log out</button>
                        </div>
                    </div>
                </template>
                <template v-else>
                    <NuxtLink to="/auth/login" class="hidden items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-ink sm:inline-flex"><Icon name="heroicons-outline:arrow-left-on-rectangle" class="h-4 w-4" />Log in</NuxtLink>
                </template>

                <NuxtLink to="/add" class="btn-primary hidden py-2 sm:inline-flex"><Icon name="heroicons-outline:plus" class="h-4 w-4" />Add server</NuxtLink>

                <button type="button" class="grid h-9 w-9 cursor-pointer place-items-center rounded-lg text-muted hover:bg-raised hover:text-ink md:hidden" :aria-expanded="open" aria-controls="mobile-nav" @click="open = !open">
                    <span class="sr-only">Menu</span>
                    <Icon :name="open ? 'heroicons-outline:x-mark' : 'heroicons-outline:bars-3'" class="h-5 w-5" />
                </button>
            </div>
        </nav>

        <div v-show="open" id="mobile-nav" class="border-t border-line md:hidden">
            <div class="mx-auto flex max-w-6xl flex-col px-4 py-2">
                <NuxtLink v-for="l in links" :key="l.to" :to="l.to" class="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm" :class="isActive(l.to) ? 'bg-raised text-ink' : 'text-muted'" @click="open = false"><Icon :name="l.icon" class="h-4 w-4" />{{ l.label }}</NuxtLink>
                <NuxtLink v-if="!user" to="/auth/login" class="rounded-lg px-3 py-2.5 text-sm text-muted" @click="open = false">Log in</NuxtLink>
                <NuxtLink to="/add" class="btn-primary mt-2" @click="open = false"><Icon name="heroicons-outline:plus" class="h-4 w-4" />Add server</NuxtLink>
            </div>
        </div>
    </header>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from "vue";

const links = [
    { to: "/", label: "Servers", icon: "heroicons-outline:queue-list" },
    { to: "/find", label: "Search", icon: "heroicons-outline:magnifying-glass" },
    { to: "/your-servers", label: "Your servers", icon: "heroicons-outline:server-stack" },
];

const route = useRoute();
const open = ref(false);
const menuOpen = ref(false);
const menuRef = ref<HTMLElement | null>(null);
const { user, refresh, logout } = useAuth();
const toast = useAppToast();

const initial = computed(() => (user.value?.displayName?.trim()?.[0] || "U").toUpperCase());

function isActive(to: string) {
    return to === "/" ? route.path === "/" : route.path.startsWith(to);
}

onMounted(() => {
    refresh().catch(() => null);
    document.addEventListener("click", handleDocumentClick);
});

onBeforeUnmount(() => {
    document.removeEventListener("click", handleDocumentClick);
});

function handleDocumentClick(e: MouseEvent) {
    const target = e.target as Node | null;
    if (target && menuRef.value && !menuRef.value.contains(target)) menuOpen.value = false;
}

async function onLogout() {
    try {
        await logout();
        toast.success("Logged out");
    } catch (e: any) {
        toast.error(e?.data?.message || e?.message || "Logout failed");
    }
    open.value = false;
    menuOpen.value = false;
    await navigateTo("/");
}
</script>

