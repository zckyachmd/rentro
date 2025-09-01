import ClipboardJS from 'clipboard';

export type ClipboardCallbacks = {
    success?: () => void;
    error?: () => void;
};

export function initClipboard(
    selector: string,
    callbacks: ClipboardCallbacks | null = null,
) {
    const clipboard = new ClipboardJS(selector);

    clipboard.on('success', () => {
        callbacks?.success?.();
    });

    clipboard.on('error', () => {
        callbacks?.error?.();
    });

    return clipboard;
}
