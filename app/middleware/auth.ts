export default defineNuxtRouteMiddleware(async () => {
    const { user, refresh } = useAuth();

    if (!user.value) {
        await refresh().catch(() => null);
    }

    if (!user.value) {
        return navigateTo("/auth/login");
    }
});