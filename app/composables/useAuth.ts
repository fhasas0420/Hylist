type PublicUser = {
    id: string;
    email: string;
    displayName: string;
    avatarUrl?: string | null;
    role: "user" | "vip" | "admin";
    vipUntil?: number | null;
};

type AuthResponse = { user: PublicUser | null };

type LoginInput = { email: string; password: string };

type RegisterInput = { displayName: string; email: string; password: string };

export function useAuth() {
    const user = useState<PublicUser | null>("auth.user", () => null);
    const loading = useState<boolean>("auth.loading", () => false);
    const requestFetch = useRequestFetch();

    async function refresh() {
        const res = await requestFetch<AuthResponse>("/api/auth/me");
        user.value = res.user;
        return res.user;
    }

    async function login(input: LoginInput) {
        loading.value = true;
        try {
            const res = await $fetch<{ user: PublicUser }>("/api/auth/login", {
                method: "POST",
                body: input,
            });
            user.value = res.user;
            return res.user;
        } finally {
            loading.value = false;
        }
    }

    async function register(input: RegisterInput) {
        loading.value = true;
        try {
            const res = await $fetch<{ user: PublicUser }>("/api/auth/register", {
                method: "POST",
                body: input,
            });
            user.value = res.user;
            return res.user;
        } finally {
            loading.value = false;
        }
    }

    async function logout() {
        loading.value = true;
        try {
            await $fetch("/api/auth/logout", { method: "POST" });
            user.value = null;
        } finally {
            loading.value = false;
        }
    }

    return { user, loading, refresh, login, register, logout };
}