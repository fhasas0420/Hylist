import type { ToastOptions as ToastifyOptions } from "vue3-toastify";

type ToastType = "default" | "success" | "error" | "info" | "warning";
type ToastOptions = ToastifyOptions<{}>;

function show(message: string, options: ToastOptions = {}) {
    if (!import.meta.client) return;
    useToastify(message, {
        toastClassName: "app-toast",
        ...options,
    });
}

export function useAppToast() {
    return {
        show,
        success: (message: string, options: ToastOptions = {}) =>
            show(message, { ...options, type: "success" }),
        error: (message: string, options: ToastOptions = {}) =>
            show(message, { ...options, type: "error" }),
        info: (message: string, options: ToastOptions = {}) =>
            show(message, { ...options, type: "info" }),
        warning: (message: string, options: ToastOptions = {}) =>
            show(message, { ...options, type: "warning" }),
    };
}