import { create } from 'zustand';

export type NotificationItem = {
    id?: string;
    title: string | Record<string, unknown>;
    message: string | Record<string, unknown>;
    action_url?: string | null;
    meta?: Record<string, unknown> | null;
    created_at?: string;
    read_at?: string | null;
};

type State = {
    items: NotificationItem[];
    unreadCount: number;
};

type Actions = {
    setInitial: (items: NotificationItem[], unread: number) => void;
    add: (item: NotificationItem) => void;
    upsert: (item: NotificationItem) => void;
    update: (id: string, patch: Partial<NotificationItem>) => void;
    markRead: (id: string) => void;
    markAllRead: () => void;
    syncFromServer: (items: NotificationItem[], unread: number) => void;
};

export const useNotificationsStore = create<State & Actions>((set) => ({
    items: [],
    unreadCount: 0,

    setInitial: (items, unread) => set({ items, unreadCount: unread }),

    add: (item) => {
        const now = new Date().toISOString();
        const obj: NotificationItem = { created_at: now, ...item };
        const isPersisted =
            Boolean(obj.id) ||
            Boolean((obj.meta as { persist?: unknown } | null)?.persist);
        set((s) => ({
            items: [obj, ...s.items],
            unreadCount: isPersisted ? s.unreadCount + 1 : s.unreadCount,
        }));
    },

    upsert: (item) =>
        set((s) => {
            const now = new Date().toISOString();
            const obj: NotificationItem = { created_at: now, ...item };
            if (obj.id) {
                const idx = s.items.findIndex((it) => it.id === obj.id);
                if (idx >= 0) {
                    const items = s.items.slice();
                    items[idx] = { ...items[idx], ...obj };
                    return { items } as Partial<State>;
                }
                // If a new persisted notification with id arrives, add and bump unread
                return {
                    items: [obj, ...s.items],
                    unreadCount: s.unreadCount + 1,
                } as Partial<State>;
            }
            // No id -> ephemeral: add to list but do not bump unread
            return {
                items: [obj, ...s.items],
                unreadCount: s.unreadCount,
            } as Partial<State>;
        }),

    update: (id, patch) =>
        set((s) => ({
            items: s.items.map((it) =>
                it.id === id ? { ...it, ...patch } : it,
            ),
        })),

    markRead: (id) =>
        set((s) => ({
            items: s.items.map((it) =>
                it.id === id
                    ? { ...it, read_at: new Date().toISOString() }
                    : it,
            ),
            unreadCount: Math.max(
                0,
                s.unreadCount -
                    (s.items.find((it) => it.id === id && !it.read_at) ? 1 : 0),
            ),
        })),

    markAllRead: () =>
        set((s) => ({
            items: s.items.map((it) => ({
                ...it,
                read_at: it.read_at ?? new Date().toISOString(),
            })),
            unreadCount: 0,
        })),

    syncFromServer: (items, unread) =>
        set((s) => {
            const ephemerals = s.items.filter((it) => !it.id);
            return {
                items: [...ephemerals, ...items],
                unreadCount: unread,
            } as Partial<State>;
        }),
}));
