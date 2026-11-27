<template>
    <ClientOnly>
        <Teleport to="body">
            <div class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4"
                @click.self="onBackdrop">
                <div ref="panel"
                    class="relative w-full max-w-lg rounded-[10px] border border-line-strong bg-surface outline-none"
                    role="dialog" aria-modal="true" tabindex="-1" @click.stop>
                    <div class="flex items-start justify-between gap-4 border-b border-line p-4">
                        <div class="min-w-0 flex-1">
                            <slot name="title" />
                        </div>

                        <button type="button"
                            class="grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-muted hover:bg-raised hover:text-ink"
                            aria-label="Close" :disabled="disableClose" @click="onClose">
                            <Icon name="heroicons-outline:x-mark" class="h-5 w-5" />
                        </button>
                    </div>

                    <div class="p-4">
                        <slot name="content" />
                    </div>

                    <div class="p-4 pt-0">
                        <slot name="footer" />
                    </div>
                </div>
            </div>
        </Teleport>
    </ClientOnly>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";

const props = withDefaults(
    defineProps<{
        disableClose?: boolean;
        closeOnBackdrop?: boolean;
        closeOnEsc?: boolean;
    }>(),
    {
        disableClose: false,
        closeOnBackdrop: true,
        closeOnEsc: true,
    },
);

const emit = defineEmits<{
    (e: "close"): void;
}>();

const panel = ref<HTMLElement | null>(null);

function onClose() {
    if (props.disableClose) return;
    emit("close");
}

function onBackdrop() {
    if (!props.closeOnBackdrop) return;
    onClose();
}

function onKeydown(e: KeyboardEvent) {
    if (!props.closeOnEsc) return;
    if (e.key === "Escape") onClose();
}

function lockScroll(lock: boolean) {
    if (!import.meta.client) return;
    document.body.classList.toggle("overflow-hidden", lock);
}

onMounted(async () => {
    lockScroll(true);
    window.addEventListener("keydown", onKeydown);
    await nextTick();
    panel.value?.focus();
});

onBeforeUnmount(() => {
    window.removeEventListener("keydown", onKeydown);
    lockScroll(false);
});
</script>
