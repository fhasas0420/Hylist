<template>
    <section class="px-4 py-16 sm:py-24">
        <AuthCard title="Log in" subtitle="Manage your servers and profile.">
            <form class="space-y-4" @submit.prevent="onSubmit">
                <div>
                    <label class="label" for="email">Email</label>
                    <input id="email" v-model="email" type="email" autocomplete="email" class="field mt-1.5" placeholder="you@example.com" required />
                </div>
                <div>
                    <label class="label" for="password">Password</label>
                    <input id="password" v-model="password" type="password" autocomplete="current-password" class="field mt-1.5" required />
                </div>
                <p v-if="error" class="text-sm text-danger">{{ error }}</p>
                <button class="btn-primary w-full" type="submit" :disabled="loading">
                    {{ loading ? "Logging in…" : "Log in" }}
                </button>
            </form>
            <template #below>
                No account yet? <NuxtLink to="/auth/register" class="font-medium text-accent hover:underline">Create one</NuxtLink>
            </template>
        </AuthCard>
    </section>
</template>

<script setup lang="ts">
import AuthCard from "~/utils/AuthCard.vue";

useHead({ title: "Log in — HyList" });

const toast = useAppToast();
const { login, loading, refresh, user } = useAuth();

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
        await login({ email: email.value, password: password.value });
        toast.success("Logged in");
        const next = String(useRoute().query.next || "/");
        await navigateTo(next.startsWith("/") && !next.startsWith("//") ? next : "/");
    } catch (e: any) {
        error.value = e?.data?.message || e?.message || "Failed to log in";
    }
}
</script>
