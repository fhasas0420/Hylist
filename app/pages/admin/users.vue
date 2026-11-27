<template>
    <section class="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6">
        <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between gap-4">
                <h1 class="text-[28px] font-bold leading-tight tracking-tight">Users</h1>
                <NuxtLink to="/admin" class="text-sm text-muted hover:text-ink">← Admin panel</NuxtLink>
            </div>
            <p class="text-sm text-muted">Search users and change roles.</p>
        </div>

        <div class="mt-6 panel p-4">
            <div class="grid gap-3 md:grid-cols-3 md:items-end">
                <div class="md:col-span-2">
                    <label class="label">Search by email</label>
                    <input v-model="q" type="search" placeholder="example@gmail.com" class="field mt-2" />
                </div>

                <div class="flex justify-end">
                    <button type="button" class="btn-ghost" :disabled="pending" @click="refresh()">
                        Refresh
                    </button>
                </div>
            </div>

            <div class="mt-3 text-xs text-dim">Page {{ page }}, showing up to {{ perPage }} users.</div>
        </div>

        <div class="mt-6">
            <div v-if="pending" class="panel p-6 text-muted">Loading…</div>
            <div v-else-if="error" class="panel p-6 text-danger">Failed to load users.</div>

            <div v-else class="panel overflow-hidden">
                <div class="overflow-auto">
                    <table class="min-w-full text-left text-sm">
                        <thead class="border-b border-line text-xs uppercase tracking-wider text-dim">
                            <tr>
                                <th class="px-4 py-3">User</th>
                                <th class="px-4 py-3">Created</th>
                                <th class="px-4 py-3">Last sign-in</th>
                                <th class="px-4 py-3">Role</th>
                                <th class="px-4 py-3">VIP until</th>
                                <th class="px-4 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="u in users" :key="u.id" class="border-t border-line">
                                <td class="px-4 py-3">
                                    <p class="font-semibold text-ink">{{ u.displayName || "—" }}</p>
                                    <p class="text-xs text-dim">{{ u.email }}</p>
                                </td>
                                <td class="px-4 py-3 text-muted">{{ fmt(u.createdAt) }}</td>
                                <td class="px-4 py-3 text-muted">{{ fmt(u.lastSignInAt) }}</td>
                                <td class="px-4 py-3">
                                    <select v-model="editRole[u.id]" class="field w-28 py-2">
                                        <option value="user">user</option>
                                        <option value="vip">vip</option>
                                        <option value="admin">admin</option>
                                    </select>
                                </td>
                                <td class="px-4 py-3">
                                    <div v-if="editRole[u.id] === 'vip'" class="flex flex-col gap-1">
                                        <input v-model="editVipUntil[u.id]" type="date" :min="today" class="field w-40 py-2" />
                                        <span class="text-xs" :class="u.role === 'vip' && !u.vipActive ? 'text-danger' : 'text-dim'">
                                            {{ u.role === 'vip' && !u.vipActive ? 'Expired' : editVipUntil[u.id] ? 'Until the end of that day' : 'Empty = no end date' }}
                                        </span>
                                    </div>
                                    <span v-else class="text-dim">—</span>
                                </td>
                                <td class="px-4 py-3">
                                    <div class="flex justify-end">
                                        <button type="button" class="btn-primary py-2" :disabled="savingId === u.id" @click="save(u.id)">
                                            {{ savingId === u.id ? "Saving…" : "Save" }}
                                        </button>
                                    </div>
                                </td>
                            </tr>

                            <tr v-if="users.length === 0">
                                <td colspan="6" class="px-4 py-8 text-center text-muted">No users found.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watchEffect } from "vue";

definePageMeta({ middleware: "admin" });
useHead({ title: "Admin Users — HyList" });

const toast = useAppToast();
const { ask } = useConfirm();

type AdminUser = {
    id: string;
    email: string;
    displayName: string;
    role: "user" | "vip" | "admin";
    createdAt: number | null;
    lastSignInAt: number | null;
    vipUntil: number | null;
    vipActive: boolean;
};

const page = ref(1);
const perPage = 50;
const q = ref("");
const savingId = ref<string | null>(null);

const query = computed(() => ({
    page: page.value,
    perPage,
    q: q.value || undefined,
}));

const { data, pending, error, refresh } = await useFetch<{
    users: AdminUser[];
}>("/api/admin/users", {
    query,
    watch: [query],
});

const users = computed(() => data.value?.users ?? []);

const editRole = reactive<Record<string, "user" | "vip" | "admin">>({});
const editVipUntil = reactive<Record<string, string>>({});
const today = new Date().toISOString().slice(0, 10);

function toDateInput(ts: number | null) {
    return ts ? new Date(ts).toISOString().slice(0, 10) : "";
}

watchEffect(() => {
    for (const u of users.value) {
        editRole[u.id] = u.role;
        editVipUntil[u.id] = toDateInput(u.vipUntil);
    }
});

function fmt(ts: number | null) {
    if (!ts) return "—";
    try {
        return new Date(ts).toLocaleString();
    } catch {
        return "—";
    }
}

async function save(id: string) {
    const role = editRole[id];
    const u = users.value.find((x: any) => x.id === id);
    const ok = await ask({
        title: `Change role to ${role}?`,
        message: `${u?.displayName || "This user"} will get the “${role}” role.${role === "vip" ? (editVipUntil[id] ? ` VIP ends on ${editVipUntil[id]}.` : " VIP has no end date.") : ""}`,
        confirmText: "Change role",
        danger: role === "admin",
    });
    if (!ok) return;
    savingId.value = id;
    try {

        const date = editVipUntil[id];
        const vipUntil = role === "vip" && date ? new Date(`${date}T23:59:59`).toISOString() : null;
        await $fetch(`/api/admin/users/${id}`, {
            method: "PATCH",
            body: { role, vipUntil },
        });

        toast.success("Role updated!");
        await refresh();
    } catch (e: any) {
        toast.error(e?.data?.message || "Failed to update role");
    } finally {
        savingId.value = null;
    }
}
</script>