export default defineNuxtRouteMiddleware(async () => {
    const { user, refresh } = useAuth();

    if (!user.value) {
        await Promise.race([
            refresh().catch(() => null),
            new Promise((res) => setTimeout(res, 2000)),
        ]);
    }

    if (!user.value) {
        return navigateTo("/auth/login");
    }

    if (user.value.role !== "admin") {
        return navigateTo("/");
    }
});