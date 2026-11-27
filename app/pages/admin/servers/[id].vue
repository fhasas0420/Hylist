<template>
    <section class="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6">
        <NuxtLink to="/admin/servers" class="text-sm text-muted hover:text-ink">← Back to Servers</NuxtLink>
        <div class="mt-4 flex items-start justify-between gap-4">
            <div class="flex flex-col">
                <h1 class="text-[28px] font-bold leading-tight tracking-tight">Edit server: {{ server?.name || "…" }}</h1>
                <p class="mt-1 text-sm text-muted">Update server information (admin).</p>
            </div>

            <div class="flex items-center gap-3">
                <button class="btn-ghost" type="button" :disabled="deleting" @click="showDeleteModal = true">
                    Delete
                </button>
                <button class="btn-primary" type="button" :disabled="saving || pending" @click="save">
                    <Icon name="heroicons-outline:check" class="h-4 w-4" />{{ saving ? "Saving…" : "Save changes" }}
                </button>
            </div>
        </div>

        <div v-if="pending" class="panel mt-6 p-6 text-muted">Loading…</div>
        <div v-else-if="loadError" class="panel mt-6 p-6 text-danger">{{ loadError }}</div>

        <div v-else-if="draft" class="mt-6 grid gap-6 md:grid-cols-[1fr_360px]">
            <div class="space-y-6">
                <div class="panel p-6">
                    <h2 class="text-[15px] font-semibold">General</h2>
                    <p class="mt-1 text-sm text-muted">General information about the server.</p>

                    <div class="mt-4 grid gap-4">
                        <div class="flex flex-col">
                            <label class="label">Server name</label>
                            <input v-model="draft.name" type="text" maxlength="56" class="field mt-1" />
                        </div>

                        <div class="flex flex-col">
                            <label class="label">Description</label>
                            <textarea v-model="draft.description" rows="4" maxlength="2000" class="field mt-1 resize-y" />
                        </div>
                    </div>
                </div>

                    <div class="panel p-6">
                    <h2 class="text-[15px] font-semibold">Connection</h2>
                    <p class="mt-1 text-sm text-muted">Set up the server connection.</p>

                    <div class="mt-4 grid gap-3 sm:grid-cols-2">
                        <div class="flex flex-col">
                            <label class="label">Address</label>
                            <input v-model="draft.host" type="text" class="field mt-1" />
                        </div>
                        <div class="flex flex-col">
                            <label class="label">Port</label>
                            <input v-model.number="draft.port" type="number" min="1" max="65535" class="field mt-1" />
                        </div>
                    </div>
                </div>

                <div v-if="draft" class="panel p-4">
                    <div class="flex items-center justify-between">
                        <div class="flex flex-col">
                            <p class="text-sm font-medium text-ink">Featured</p>
                            <p class="text-xs text-muted">Featured servers are prioritized in public lists.</p>
                        </div>

                        <label class="inline-flex items-center gap-3">
                            <input type="checkbox" v-model="draft.isFeatured" class="h-4 w-4 rounded" />
                            <span class="text-sm text-ink">{{ draft.isFeatured ? 'Yes' : 'No' }}</span>
                        </label>
                    </div>
                </div>
            </div>

            <div class="space-y-6">
                <div class="panel p-6">
                    <h2 class="text-[15px] font-semibold">Branding</h2>
                    <p class="mt-1 text-sm text-muted">Upload a banner and logo for the server card.</p>

                    <div class="mt-4 space-y-4">
                        <div class="flex flex-col">
                            <p class="text-sm text-muted">Banner</p>
                            <div class="mt-2 overflow-hidden rounded-lg ring-1 ring-line-strong">
                                <img v-if="draft.bannerUrl" :src="draft.bannerUrl" alt="banner" class="h-28 w-full object-cover" />
                                <div v-else class="h-28 w-full bg-raised" />
                            </div>
                            <div class="mt-2">
                                <div class="flex items-center gap-3">
                                    <input ref="bannerInput" type="file" accept="image/png,image/jpeg,image/webp,image/gif" class="sr-only" :disabled="uploadingBanner" @change="onPickBanner" />
                                    <button type="button" class="btn-ghost py-2" :disabled="uploadingBanner" @click="() => (bannerInput as HTMLInputElement | null)?.click()">
                                        {{ bannerFilename ? "Change" : draft.bannerUrl ? "Change" : "Choose file" }}
                                    </button>

                                    <button v-if="draft.bannerUrl" type="button" class="btn-danger py-2" :disabled="saving || uploadingBanner" @click="removeMedia('banner')">
                                        Remove
                                    </button>
                                </div>

                                <div class="mt-2">
                                    <div class="text-xs text-muted truncate">{{ bannerFilename || (draft.bannerUrl ? "Uploaded" : "No file chosen") }}</div>
                                </div>
                            </div>
                            <p class="mt-2 text-xs text-dim">Max ~4MB. PNG/JPG/WebP/GIF.</p>
                        </div>

                        <div>
                            <p class="text-sm text-muted">Logo</p>
                            <div class="mt-2 flex items-start gap-3">
                                <div class="flex flex-col items-start gap-2">
                                    <div class="h-16 w-16 overflow-hidden rounded-lg bg-field ring-1 ring-line-strong">
                                        <img v-if="draft.logoUrl" :src="draft.logoUrl" alt="logo" class="h-full w-full object-cover" />
                                        <div v-else class="h-full w-full grid place-items-center text-muted font-semibold">
                                            {{ (draft.name?.trim()?.[0] || "S").toUpperCase() }}
                                        </div>
                                    </div>

                                    <input ref="logoInput" type="file" accept="image/png,image/jpeg,image/webp,image/gif" class="sr-only" :disabled="uploadingLogo" @change="onPickLogo" />

                                    <div class="flex items-center gap-3">
                                        <button type="button" class="btn-ghost py-2" :disabled="uploadingLogo" @click="() => (logoInput as HTMLInputElement | null)?.click()">
                                            {{ logoFilename ? "Change" : draft.logoUrl ? "Change" : "Choose file" }}
                                        </button>

                                        <button v-if="draft.logoUrl" type="button" class="btn-danger py-2" :disabled="saving || uploadingLogo" @click="removeMedia('logo')">
                                            Remove
                                        </button>
                                    </div>

                                    <div class="text-xs text-muted truncate">{{ logoFilename || (draft.logoUrl ? "Uploaded" : "No file chosen") }}</div>
                                    <p class="text-xs text-dim">Max ~1.5MB. Square works best. GIFs supported.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="panel p-6">
                    <h2 class="text-[15px] font-semibold">Categories</h2>
                    <p class="mt-1 text-sm text-muted">Choose tags that best describe the server.</p>

                    <div class="mt-4 flex flex-wrap gap-2">
                        <button v-for="t in TAGS" :key="t" type="button" class="chip" :class="draft.tags.includes(t) && 'chip-on'" @click="toggleTag(t)">
                            {{ t }}
                        </button>
                    </div>
                    <p class="mt-3 text-xs text-dim">{{ draft.tags.length }}/8 tags selected</p>
                </div>

                <div class="panel p-6">
                    <h2 class="text-[15px] font-semibold">Location</h2>
                    <p class="mt-1 text-sm text-muted">Where is the server located?</p>
                    <div class="mt-2">
                        <select v-model="draft.country" class="field">
                            <option value="" disabled>Select a country</option>
                            <option v-for="c in COUNTRIES" :key="c" :value="c">{{ c }}</option>
                        </select>
                    </div>
                </div>
                <div v-if="saveError" class="panel p-4 text-sm text-danger">{{ saveError }}</div>
            </div>
        </div>
    </section>
    <ConfirmModal v-if="showDeleteModal" :disable-close="deleting" :close-on-backdrop="!deleting" :close-on-esc="!deleting" @close="showDeleteModal = false">
            <template #title>
                <div class="flex items-center gap-2 items-center justify-center">
                    <span class="w-10 h-10 p-2 rounded-lg bg-danger grid place-items-center">
                        <Icon name="heroicons-outline:trash" class="w-5 h-5 text-danger" />
                    </span>
                    <h3 class="text-lg font-semibold text-ink">Delete server</h3>
                </div>
            </template>

            <template #content>
                <p class="text-sm text-muted">
                    Are you sure you want to delete <span class="font-semibold text-ink">{{ serverName }}</span>?
                    <span class="block mt-2 text-danger">This action is irreversible.</span>
                </p>
            </template>

            <template #footer>
                <div class="flex flex-col-reverse gap-4 sm:flex-row sm:justify-end">
                    <button type="button" class="btn-ghost" :disabled="deleting" @click="showDeleteModal = false">
                        Cancel
                    </button>
                    <button type="button" class="btn-danger" :disabled="deleting" @click="onDelete">
                        {{ deleting ? "Deleting…" : "Delete" }}
                    </button>
                </div>
            </template>
    </ConfirmModal>    
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { TAGS } from "~/utils/tags";
import { COUNTRIES } from "~/utils/countries";

definePageMeta({ middleware: "admin" });
const toast = useAppToast();
const requestFetch = useRequestFetch();

type AdminServer = {
    id: string;
    name: string;
    description?: string;
    host: string;
    port: number;
    country: string;
    tags: string[];
    logoUrl?: string;
    bannerUrl?: string;
    verificationToken?: string;
    isFeatured?: boolean;
};

const route = useRoute();
const id = computed(() => String(route.params.id || ""));
const pending = ref(true);
const loadError = ref<string | null>(null);
const saveError = ref<string | null>(null);
const saving = ref(false);
const deleting = ref(false);
const showDeleteModal = ref(false);

const server = ref<AdminServer | null>(null);

const serverName = computed(() => server.value?.name || "this server");
useHead(() => ({
    title: serverName.value
        ? `Edit Server ${serverName.value} — HyList Admin`
        : "Edit Server — HyList Admin",
}));

const draft = ref<{
    id: string;
    name: string;
    description: string;
    host: string;
    port: number;
    country: string;
    tags: string[];
    logoUrl?: string;
    bannerUrl?: string;
    verificationToken?: string;
    isFeatured?: boolean;
} | null>(null);

const uploadingLogo = ref(false);
const uploadingBanner = ref(false);
const bannerInput = ref<HTMLInputElement | null>(null);
const logoInput = ref<HTMLInputElement | null>(null);
const bannerFilename = ref<string | null>(null);
const logoFilename = ref<string | null>(null);

async function uploadMedia(kind: "logo" | "banner", file: File) {
    const fd = new FormData();
    fd.set("kind", kind);
    fd.set("file", file);
    const res = await $fetch<{ ok: true; url: string }>(
        `/api/servers/${id.value}/media`,
        {
            method: "POST",
            body: fd,
        },
    );
    if (!draft.value) return;
    if (kind === "logo") draft.value.logoUrl = res.url;
    else draft.value.bannerUrl = res.url;
}

async function onPickLogo(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    uploadingLogo.value = true;
    try {
        await uploadMedia("logo", file);
        logoFilename.value = file.name;
    } catch (err: any) {
        toast.error("Failed to upload logo!");
    } finally {
        uploadingLogo.value = false;
        input.value = "";
    }
}

async function onPickBanner(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    uploadingBanner.value = true;
    try {
        await uploadMedia("banner", file);
        bannerFilename.value = file.name;
    } catch (err: any) {
        toast.error("Failed to upload banner!");
    } finally {
        uploadingBanner.value = false;
        input.value = "";
    }
}

async function removeMedia(kind: "logo" | "banner") {
    if (!draft.value) return;
    saving.value = true;
    try {
        await $fetch(`/api/admin/servers/${id.value}`, {
            method: "PATCH",
            body: kind === "logo" ? { logoUrl: null } : { bannerUrl: null },
        });
        if (kind === "logo") {
            draft.value.logoUrl = undefined;
            logoFilename.value = null;
        } else {
            draft.value.bannerUrl = undefined;
            bannerFilename.value = null;
        }
        await load();
    } catch (err: any) {
        toast.error("Failed to remove media!");
    } finally {
        saving.value = false;
    }
}

function toggleTag(t: string) {
    if (!draft.value) return;
    const idx = draft.value.tags.findIndex(
        (s) => String(s).toLowerCase() === String(t).toLowerCase(),
    );
    if (idx >= 0) {
        draft.value.tags.splice(idx, 1);
        return;
    }
    if (draft.value.tags.length >= 8) return;
    const match = TAGS.find((x) => x.toLowerCase() === String(t).toLowerCase());
    draft.value.tags.push(match ?? t);
}

async function load() {
    pending.value = true;
    loadError.value = null;
    try {
        const res = await requestFetch<AdminServer>(`/api/admin/servers/${id.value}`);
        server.value = res;
        draft.value = {
            id: res.id,
            name: res.name,
            description: String(res.description ?? ""),
            host: res.host,
            port: res.port,
            country: res.country,
            tags: Array.isArray(res.tags)
                ? res.tags.map((st) => {
                    const s = String(st || "");
                    const match = TAGS.find((t) => t.toLowerCase() === s.toLowerCase());
                    return match ?? s;
                })
                : [],
            logoUrl: res.logoUrl,
            bannerUrl: res.bannerUrl,
            verificationToken: res.verificationToken,
            isFeatured: Boolean(res.isFeatured),
        };
        bannerFilename.value = null;
        logoFilename.value = null;
    } catch (e: any) {
        loadError.value = e?.data?.message || e?.message || "Failed to load server";
        toast.error("Failed to load server!");
    } finally {
        pending.value = false;
    }
}

function validate() {
    if (!draft.value) return "Missing form";
    if (draft.value.name.trim().length < 2) return "Server name is required";
    if (!draft.value.host.trim()) return "Server IP/host is required";
    const p = Number(draft.value.port);
    if (!Number.isFinite(p) || p < 1 || p > 65535) return "Invalid port";
    if (draft.value.description.trim().length < 1)
        return "Description is required";
    if (!draft.value.country.trim()) return "Server location is required";
    if (draft.value.tags.length === 0) return "Select at least one tag";
    return null;
}

async function save() {
    saveError.value = null;
    const e = validate();
    if (e) {
        saveError.value = e;
        return;
    }

    saving.value = true;
    try {
        await $fetch(`/api/admin/servers/${id.value}`, {
            method: "PATCH",
            body: {
                name: draft.value!.name,
                description: draft.value!.description,
                host: draft.value!.host,
                port: draft.value!.port,
                country: draft.value!.country,
                tags: draft.value!.tags,
                isFeatured: Boolean(draft.value!.isFeatured),
            },
        });
        toast.success("Server saved successfully!");
        await load();
    } catch (e: any) {
        saveError.value = e?.data?.message || e?.message || "Failed to save";
        toast.error("Failed to save server!");
    } finally {
        saving.value = false;
    }
}

async function onDelete() {
    deleting.value = true;
    try {
        await $fetch(`/api/admin/servers/${id.value}`, { method: "DELETE" });
        toast.success("Server is deleted!");
        showDeleteModal.value = false;
        await navigateTo("/admin/servers");
    } catch (e: any) {
        toast.error("Failed to delete server!");
    } finally {
        deleting.value = false;
    }
}

await load();
</script>