<template>
    <section class="px-4 py-16 sm:py-24">
        <AuthCard title="Create account" subtitle="List your server and keep it up to date.">
            <form class="space-y-4" @submit.prevent="onSubmit">
                <div>
                    <label class="label" for="name">Display name</label>
                    <input id="name" v-model="displayName" type="text" autocomplete="nickname" maxlength="100" class="field mt-1.5" required />
                </div>
                <div>
                    <label class="label" for="email">Email</label>
                    <input id="email" v-model="email" type="email" autocomplete="email" class="field mt-1.5" placeholder="you@example.com" required />
                </div>
                <div>
                    <label class="label" for="password">Password</label>
                    <input id="password" v-model="password" type="password" autocomplete="new-password" minlength="6" class="field mt-1.5" required />
                    <p class="mt-1.5 text-xs text-dim">At least 6 characters.</p>
                </div>
                <p v-if="error" class="text-sm text-danger">{{ error }}</p>
                <button class="btn-primary w-full" type="submit" :disabled="loading">
                    {{ loading ? "Creating account…" : "Create account" }}
                </button>
            </form>
            <template #below>
                Already registered? <NuxtLink to="/auth/login" class="font-medium text-accent hover:underline">Log in</NuxtLink>
            </template>
        </AuthCard>
    </section>
</template>

<script setup lang="ts">
import AuthCard from "~/utils/AuthCard.vue";

useHead({ title: "Create account — HyList" });

const { register, loading, refresh, user } = useAuth();
const displayName = ref("");
const email = ref("");
const password = ref("");
const error = ref<string | null>(null);

onMounted(async () => {
    await refresh().catch(() => null);
    if (user.value) await navigateTo("/");
});

async function onSubmit() {
    error.value = null;
    try {
        await register({ displayName: displayName.value, email: email.value, password: password.value });
        await navigateTo("/");
    } catch (e: any) {
        error.value = e?.data?.message || e?.message || "Failed to register";
    }
}
</script>
