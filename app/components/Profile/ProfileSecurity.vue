<template>
  <div class="panel p-6">
    <h2 class="text-[15px] font-semibold">Account &amp; security</h2>
    <p class="mt-1 text-sm text-muted">Sign-in details and devices.</p>

    <ul class="mt-4 divide-y divide-line">
      <li class="flex items-center justify-between gap-4 py-3.5">
        <div class="min-w-0"><p class="text-sm">Email</p><p class="truncate text-xs text-muted">{{ props.user?.email || "—" }}</p></div>
        <button @click="openEmailModal" type="button" class="btn-ghost shrink-0 py-2">Change</button>
      </li>
      <li class="flex items-center justify-between gap-4 py-3.5">
        <div><p class="text-sm">Password</p><p class="text-xs text-muted">Changing it signs out your other devices.</p></div>
        <button @click="openPasswordModal" type="button" class="btn-ghost shrink-0 py-2">Change</button>
      </li>
      <li class="flex items-center justify-between gap-4 py-3.5">
        <div><p class="text-sm">Other devices</p><p class="text-xs text-muted">{{ otherSessionsText }}</p></div>
        <button type="button" class="btn-ghost shrink-0 py-2" :disabled="!props.otherSessions || signingOut" @click="signOutOthers">{{ signingOut ? "Signing out…" : "Sign out others" }}</button>
      </li>
      <li class="flex items-center justify-between gap-4 py-3.5">
        <div><p class="text-sm text-danger">Delete account</p><p class="text-xs text-muted">Removes your account and your servers. This can't be undone.</p></div>
        <button @click="openDeleteModal" type="button" class="btn-ghost shrink-0 py-2 text-danger">Delete</button>
      </li>
    </ul>

    <ConfirmModal v-if="showPasswordModal" :disableClose="loadingChange" @close="showPasswordModal = false">
    <template #title>
        <div>
            <h3 class="text-base font-semibold">Change password</h3>
        </div>
    </template>

      <template #content>
        <div class="flex flex-col gap-3">
          <div>
            <label class="label mb-1.5 block">Current password</label>
            <input v-model="oldPassword" type="password" class="field" />
          </div>
          <div>
            <label class="label mb-1.5 block">New password</label>
            <input v-model="newPassword" type="password" class="field" />
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <button @click="showPasswordModal = false" :disabled="loadingChange" class="btn-ghost py-2">Cancel</button>
          <button @click="confirmChangePassword" :disabled="loadingChange" class="btn-primary py-2">Change</button>
        </div>
      </template>
    </ConfirmModal>

    <ConfirmModal v-if="showEmailModal" :disableClose="loadingEmail" @close="showEmailModal = false">
    <template #title>
        <div>
            <h3 class="text-base font-semibold">Change email</h3>
        </div>
    </template>

      <template #content>
          <div class="flex flex-col gap-3">
            <div>
              <label class="label mb-1.5 block">Current email</label>
              <input :value="props.user?.email || ''" readonly class="field text-muted" />
            </div>
            <div>
              <label class="label mb-1.5 block">New email</label>
              <input v-model="newEmail" type="email" class="field" />
            </div>
            <div>
              <label class="label mb-1.5 block">Repeat new email</label>
              <input v-model="confirmNewEmail" type="email" class="field" />
            </div>
            <div>
              <label class="label mb-1.5 block">Confirm with password</label>
              <input v-model="emailPassword" type="password" class="field" />
            </div>
          </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <button @click="showEmailModal = false" :disabled="loadingEmail" class="btn-ghost py-2">Cancel</button>
          <button @click="confirmChangeEmail" :disabled="loadingEmail" class="btn-primary py-2">Save</button>
        </div>
      </template>
    </ConfirmModal>

    <ConfirmModal v-if="showDeleteModal" :disableClose="loadingDelete" @close="showDeleteModal = false">
      <template #title>
        <div>
            <h3 class="text-base font-semibold">Delete account</h3>
        </div>
      </template>

      <template #content>
        <div class="flex flex-col gap-3">
          <p class="text-sm text-ink">Enter your password to continue. You'll be asked to confirm in the next step.</p>
          <div>
            <label class="label mb-1.5 block">Password</label>
            <input v-model="deletePassword" type="password" placeholder="Your password" class="field" />
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <button @click="showDeleteModal = false" :disabled="loadingDelete" class="btn-ghost py-2">Cancel</button>
          <button @click="proceedToConfirmDelete" :disabled="loadingDelete" class="btn-danger py-2">Next</button>
        </div>
      </template>
    </ConfirmModal>

    <ConfirmModal v-if="showConfirmDelete" :disableClose="loadingDelete" @close="showConfirmDelete = false">
    <template #title>
        <div>
            <h3 class="text-base font-semibold">Confirm account deletion</h3>
        </div>
    </template>

      <template #content>
        <p class="text-sm text-ink">This will permanently delete your account. Are you sure?</p>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <button @click="showConfirmDelete = false" :disabled="loadingDelete" class="btn-ghost py-2">Cancel</button>
          <button @click="confirmDeleteAccount" :disabled="loadingDelete" class="btn-danger py-2">Delete</button>
        </div>
      </template>
    </ConfirmModal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAppToast } from '~/composables/useAppToast';
import ConfirmModal from '~/components/ConfirmModal.vue';
const toast = useAppToast();

const props = defineProps<{ user?: { email?: string | null; avatarUrl?: string | null; displayName?: string | null } | null; otherSessions?: number }>();

const otherSessionsText = computed(() => {
  const n = props.otherSessions ?? 0;
  return n ? `Signed in on ${n} other ${n === 1 ? "device" : "devices"}` : "Only this device is signed in";
});
const signingOut = ref(false);
async function signOutOthers() {
  signingOut.value = true;
  try {
    await $fetch("/api/auth/sessions/revoke-others", { method: "POST" });
    toast.success("Other devices signed out");
    emit("update");
  } catch (e: any) {
    toast.error(e?.data?.message || "Couldn't sign out other devices");
  } finally {
    signingOut.value = false;
  }
}
const emit = defineEmits(['update']);

const oldPassword = ref('');
const newPassword = ref('');
const deletePassword = ref('');

const showConfirmDelete = ref(false);
const loadingChange = ref(false);
const loadingDelete = ref(false);
const showPasswordModal = ref(false);
const showDeleteModal = ref(false);

const showEmailModal = ref(false);
const newEmail = ref('');
const confirmNewEmail = ref('');
const emailPassword = ref('');
const loadingEmail = ref(false);

function openPasswordModal() {
  showPasswordModal.value = true;
}

function openEmailModal() {
  newEmail.value = '';
  confirmNewEmail.value = '';
  emailPassword.value = '';
  showEmailModal.value = true;
}

async function confirmChangePassword() {
  loadingChange.value = true;
  try {
    await $fetch('/api/auth/password', {
      method: 'POST',
      body: { oldPassword: oldPassword.value, newPassword: newPassword.value },
    });
    oldPassword.value = '';
    newPassword.value = '';
    toast.success('Password changed');
    showPasswordModal.value = false;
  } catch (e: any) {
    toast.error(e?.data?.message || e?.message || 'Failed to change password');
  } finally {
    loadingChange.value = false;
  }
}

async function confirmChangeEmail() {
  if (!newEmail.value || !confirmNewEmail.value || !emailPassword.value)
    return toast.error('Fill all fields');
  if (newEmail.value !== confirmNewEmail.value)
    return toast.error('New emails do not match');

  loadingEmail.value = true;
  try {
    await $fetch('/api/auth/email', {
      method: 'POST',
      body: { newEmail: newEmail.value, password: emailPassword.value },
    });
    toast.success('Email updated');
    showEmailModal.value = false;
    emit('update');
  } catch (e: any) {
    toast.error(e?.data?.message || e?.message || 'Failed to update email');
  } finally {
    loadingEmail.value = false;
  }
}

function openDeleteModal() {
  deletePassword.value = '';
  showDeleteModal.value = true;
}

async function proceedToConfirmDelete() {
  if (!deletePassword.value) return toast.error('Enter your password');
  loadingDelete.value = true;
  try {
    await $fetch('/api/auth/verify', { method: 'POST', body: { password: deletePassword.value } });
    showDeleteModal.value = false;
    showConfirmDelete.value = true;
  } catch (e: any) {
    toast.error(e?.data?.message || e?.message || 'Invalid password');
  } finally {
    loadingDelete.value = false;
  }
}

async function confirmDeleteAccount() {
  loadingDelete.value = true;
  try {
    await $fetch('/api/auth/delete', {
      method: 'POST',
      body: { password: deletePassword.value },
    });
    toast.success('Account deleted');
    await navigateTo('/');
  } catch (e: any) {
    toast.error(e?.data?.message || e?.message || 'Failed to delete account');
  } finally {
    loadingDelete.value = false;
    showConfirmDelete.value = false;
  }
}
</script>
