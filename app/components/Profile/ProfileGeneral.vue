<template>
  <div class="panel p-6">
    <h2 class="text-[15px] font-semibold">Profile</h2>
    <p class="mt-1 text-sm text-muted">Your name and picture, shown on your servers and in the admin panel.</p>

    <div class="mt-5 flex items-center gap-4">
      <div class="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-raised text-2xl font-semibold text-muted">
        <img v-if="props.user?.avatarUrl" :src="props.user.avatarUrl" alt="avatar" class="h-full w-full object-cover" />
        <span v-else>{{ initial }}</span>
      </div>
      <div>
        <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/webp,image/gif" @change="onFile" class="hidden" />
        <div class="flex flex-wrap gap-2">
          <button @click="triggerFile" type="button" class="btn-ghost py-2" :disabled="uploading"><Icon name="heroicons-outline:arrow-up-tray" class="h-4 w-4" />{{ uploading ? "Uploading…" : "Upload new" }}</button>
          <button v-if="props.user?.avatarUrl" @click="removeAvatar" type="button" class="btn-ghost py-2 text-muted">Remove</button>
        </div>
        <p class="mt-2 text-xs text-dim">PNG, JPG, WebP or GIF.</p>
      </div>
    </div>

    <form class="mt-6 border-t border-line pt-5" @submit.prevent="saveDisplayName">
      <label class="label" for="profile-name">Username</label>
      <input id="profile-name" v-model="displayName" maxlength="100" class="field mt-1.5" />
      <p class="mt-1.5 text-xs text-dim">Must be unique.</p>
      <div class="mt-4 flex justify-end gap-2">
        <button v-if="changed" type="button" @click="resetDisplayName" class="btn-ghost py-2">Cancel</button>
        <button type="submit" class="btn-primary py-2" :disabled="saving || !displayName.trim() || !changed">{{ saving ? "Saving…" : "Save" }}</button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useAppToast } from '~/composables/useAppToast';
const props = defineProps<{ user?: { displayName?: string | null; avatarUrl?: string | null } | null }>();
const emit = defineEmits(['update']);

const displayName = ref(props.user?.displayName || '');
watch(() => props.user?.displayName, (v) => (displayName.value = v || ''));
const changed = computed(() => displayName.value.trim() !== (props.user?.displayName || ''));
const uploading = ref(false);
const saving = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const toast = useAppToast();
const initial = computed(() => (props.user?.displayName?.[0] ?? 'U'));

function resetDisplayName() {
  displayName.value = props.user?.displayName || '';
}

async function saveDisplayName() {
  saving.value = true;
  try {
    await $fetch('/api/auth/me', {
      method: 'PATCH',
      body: { displayName: displayName.value },
    });
    toast.success('Username updated');
    emit('update');
  } catch (e: any) {
    toast.error(e?.data?.message || e?.message || 'Failed to update');
  } finally {
    saving.value = false;
  }
}

function triggerFile() {
  fileInput.value?.click();
}

async function onFile(e: Event) {
  const input = e.target as HTMLInputElement;
  const f = input.files?.[0];
  if (!f) return;
  const form = new FormData();
  form.append('file', f, f.name);

  uploading.value = true;
  try {
    await $fetch('/api/auth/avatar', {
      method: 'POST',
      body: form,
    });
    toast.success('Avatar uploaded');
    emit('update');
  } catch (err: any) {
    toast.error(err?.data?.message || err?.message || 'Upload failed');
  } finally {
    uploading.value = false;
    if (input) input.value = '';
  }
}

async function removeAvatar() {
  try {
    await $fetch('/api/auth/me', { method: 'PATCH', body: { avatarUrl: null } });
    toast.success('Avatar removed');
    emit('update');
  } catch (e: any) {
    toast.error(e?.data?.message || e?.message || 'Failed to remove');
  }
}
</script>
