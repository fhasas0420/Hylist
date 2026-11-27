<template>
    <section class="mx-auto max-w-3xl px-4 pb-16 pt-10 sm:px-6">
        <h1 class="text-[28px] font-bold leading-tight tracking-tight">Settings</h1>
        <p class="mt-2 text-sm text-muted">Your username, picture, sign-in details and devices.</p>

        <div class="mt-7 space-y-6">
            <ProfileGeneral :user="user" @update="onUpdate" />
            <ProfileSecurity :user="user" :other-sessions="sessions?.otherSessions ?? 0" @update="onUpdate" />
        </div>
    </section>
</template>

<script setup lang="ts">
import ProfileGeneral from "~/components/Profile/ProfileGeneral.vue";
import ProfileSecurity from "~/components/Profile/ProfileSecurity.vue";

definePageMeta({ middleware: "auth" });
useHead({ title: "Settings — HyList" });

const { user, refresh: refreshUser } = useAuth();
const { data: sessions, refresh: refreshSessions } = await useFetch<{ otherSessions: number }>("/api/auth/sessions");

async function onUpdate() {
    await Promise.all([refreshUser().catch(() => null), refreshSessions()]);
}
</script>
