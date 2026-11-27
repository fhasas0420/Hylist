<template>
    <section class="mx-auto max-w-3xl px-4 pb-16 sm:px-6">
        <div class="pb-7 pt-11">
            <h1 class="text-[34px] font-bold leading-tight tracking-tight">Add your server</h1>
            <p class="mt-2 text-[15px] text-muted">Three short steps. You can change everything later.</p>
        </div>

        <ol class="mb-5 grid grid-cols-3 gap-2 text-sm">
            <li v-for="(label, idx) in ['General', 'Connection', 'Tags & location']" :key="label" class="border-t-2 pt-2" :class="step > idx ? 'border-accent text-ink' : 'border-line text-dim'">
                <span class="font-mono text-xs">0{{ idx + 1 }}</span>
                <span class="ml-1.5 font-medium">{{ label }}</span>
            </li>
        </ol>

        <form class="panel p-5 sm:p-6" @submit.prevent>
            <div v-if="step === 1" class="space-y-5">
                <div>
                    <label class="label" for="name">Server name</label>
                    <input id="name" v-model="name" type="text" class="field mt-1.5" placeholder="My Hytale Realm" maxlength="56" />
                    <p class="mt-1.5 flex justify-between text-xs text-dim"><span>Short and clear.</span><span>{{ name.length }}/56</span></p>
                </div>
                <div>
                    <label class="label" for="desc">Description</label>
                    <textarea id="desc" v-model="description" rows="6" class="field mt-1.5 resize-y" placeholder="Game modes, rules, community, events…" maxlength="2000" />
                    <p class="mt-1.5 flex justify-between text-xs text-dim"><span>The first two lines show on the card.</span><span>{{ description.length }}/2000</span></p>
                </div>
            </div>

            <div v-else-if="step === 2" class="space-y-5">
                <div class="grid gap-4 sm:grid-cols-[1fr_140px]">
                    <div>
                        <label class="label" for="host">Address</label>
                        <input id="host" v-model="host" type="text" class="field mt-1.5 font-mono" placeholder="play.example.com" />
                    </div>
                    <div>
                        <label class="label" for="port">Port</label>
                        <input id="port" v-model.number="port" type="number" min="1" max="65535" class="field mt-1.5 font-mono" placeholder="5520" />
                    </div>
                </div>
                <p class="text-sm text-muted">Domain or public IP, without <span class="font-mono text-ink">http://</span>. The default Hytale port is <span class="font-mono text-ink">5520</span>.</p>
                <div class="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
                    <div>
                        <label class="label" for="discord">Discord invite <span class="text-dim">(optional)</span></label>
                        <input id="discord" v-model="discordUrl" type="url" class="field mt-1.5" placeholder="https://discord.gg/yourserver" />
                    </div>
                    <div>
                        <label class="label" for="website">Website <span class="text-dim">(optional)</span></label>
                        <input id="website" v-model="websiteUrl" type="url" class="field mt-1.5" placeholder="https://example.com" />
                    </div>
                </div>
            </div>

            <div v-else class="space-y-5">
                <div>
                    <p class="label flex justify-between"><span>Tags</span><span>{{ selectedTags.length }}/8</span></p>
                    <div class="mt-2 flex flex-wrap gap-1.5">
                        <button v-for="t in TAGS" :key="t" type="button" class="chip" :class="selectedTags.includes(t) && 'chip-on'" :aria-pressed="selectedTags.includes(t)" @click="toggleTag(t)">{{ t }}</button>
                    </div>
                </div>
                <div>
                    <label class="label" for="country">Country</label>
                    <select id="country" v-model="country" class="field mt-1.5">
                        <option value="" disabled>Select a country</option>
                        <option v-for="c in COUNTRIES" :key="c" :value="c">{{ c }}</option>
                    </select>
                </div>
            </div>

            <p v-if="error" class="mt-5 text-sm text-danger">{{ error }}</p>

            <div class="mt-6 flex items-center justify-between gap-3 border-t border-line pt-5">
                <button v-if="step > 1" class="btn-ghost" type="button" :disabled="loading" @click="prev"><Icon name="heroicons-outline:arrow-left" class="h-4 w-4" />Back</button>
                <NuxtLink v-else to="/" class="btn-ghost">Cancel</NuxtLink>
                <button v-if="step < 3" class="btn-primary" type="button" :disabled="loading" @click="next">Continue<Icon name="heroicons-outline:arrow-right" class="h-4 w-4" /></button>
                <button v-else class="btn-primary" type="button" :disabled="loading" @click="onSubmit"><Icon name="heroicons-outline:check" class="h-4 w-4" />{{ loading ? 'Adding…' : 'Add server' }}</button>
            </div>
        </form>
    </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { TAGS } from "~/utils/tags";
import { COUNTRIES } from "~/utils/countries";

definePageMeta({ middleware: "auth" });
useHead({ title: "Add server — HyList" });

const toast = useAppToast();

const step = ref<1 | 2 | 3>(1);
const name = ref("");
const description = ref("");
const host = ref("");
const port = ref<number | null>(5520);
const country = ref("");
const discordUrl = ref("");
const websiteUrl = ref("");
const selectedTags = ref<string[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

function toggleTag(t: string) {
    const idx = selectedTags.value.findIndex(
        (s) => String(s).toLowerCase() === String(t).toLowerCase(),
    );
    if (idx >= 0) {
        selectedTags.value.splice(idx, 1);
        return;
    }
    if (selectedTags.value.length >= 8) return;
    const match = TAGS.find((x) => x.toLowerCase() === String(t).toLowerCase());
    selectedTags.value.push(match ?? t);
}

function validateStep(n: 1 | 2 | 3) {
    if (n === 1) {
        if (name.value.trim().length < 2) return "Server name is required";
        if (description.value.trim().length < 1)
            return "Long description is required";
        return null;
    }
    if (n === 2) {
        if (!host.value.trim()) return "Server IP/host is required";
        const p = Number(port.value ?? 0);
        if (!Number.isFinite(p) || p < 1 || p > 65535) return "Invalid port";
        return null;
    }
    if (n === 3) {
        if (selectedTags.value.length === 0) return "Select at least one tag";
        if (!country.value.trim()) return "Server location is required";
        return null;
    }
    return null;
}

function next() {
    error.value = validateStep(step.value);
    if (error.value) return;
    step.value = (step.value + 1) as any;
}

function prev() {
    error.value = null;
    step.value = (step.value - 1) as any;
}


async function onSubmit() {
    error.value = null;
    const e = validateStep(3);
    if (e) {
        error.value = e;
        step.value = 3;
        return;
    }
    loading.value = true;

    try {
        const res: any = await $fetch("/api/servers", {
            method: "POST",
            body: {
                name: name.value,
                description: description.value,
                host: host.value,
                port: port.value,
                country: country.value,
                tags: selectedTags.value,
                discordUrl: discordUrl.value,
                websiteUrl: websiteUrl.value,
            },
        });

        const server = res?.server;
        const addedName = String(server?.name || name.value || "").trim();
        await navigateTo({
            path: "/your-servers",
            query: { added: String(server?.id || ""), addedName },
        });
    } catch (e: any) {
        error.value = e?.data?.message || e?.message || "Failed to submit";
        toast.error("Failed to add server please try again.");
    } finally {
        loading.value = false;
    }
}
</script>