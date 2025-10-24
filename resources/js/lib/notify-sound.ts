// Lightweight notification sound using Web Audio API.
// Falls back silently if audio is not permitted by the browser.

let audioCtx: AudioContext | null = null;

export function playNotificationSound(volume = 0.2): void {
    try {
        const AC: any =
            (globalThis as any).AudioContext ||
            (globalThis as any).webkitAudioContext;
        if (!AC) return;
        if (!audioCtx) audioCtx = new AC();
        const ctx = audioCtx as any;

        // Some browsers suspend the context until user gesture; try resume
        try {
            if (ctx.state === 'suspended') {
                void ctx.resume?.();
            }
        } catch {}

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);

        // Envelope
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
    } catch {
        // ignore sound failures
    }
}
