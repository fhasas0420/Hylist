export type ConfirmOptions = {
    title: string;
    message?: string;
    confirmText?: string;
    danger?: boolean;
    input?: { label: string; placeholder?: string; value?: string; hint?: string; maxlength?: number };
};

type ConfirmState = ConfirmOptions & { resolve: (value: string | null) => void };

export function useConfirm() {
    const state = useState<ConfirmState | null>("confirm.dialog", () => null);

    function open(options: ConfirmOptions): Promise<string | null> {
        state.value?.resolve(null);
        return new Promise((resolve) => {
            state.value = { ...options, resolve };
        });
    }

    async function ask(options: Omit<ConfirmOptions, "input">): Promise<boolean> {
        return (await open(options)) !== null;
    }

    function askText(options: ConfirmOptions & { input: NonNullable<ConfirmOptions["input"]> }): Promise<string | null> {
        return open(options);
    }

    function answer(value: string | null) {
        state.value?.resolve(value);
        state.value = null;
    }

    return { state, ask, askText, answer };
}
