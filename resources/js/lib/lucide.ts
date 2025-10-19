import React from 'react';

type SvgComp = React.ComponentType<React.SVGProps<SVGSVGElement>>;

// Global registry cache for loaded icons
const registry = new Map<string, SvgComp>();
let dynamicMapPromise: Promise<
    Record<string, () => Promise<{ default: SvgComp }>>
> | null = null;

function getDynamicMap(): Promise<
    Record<string, () => Promise<{ default: SvgComp }>>
> {
    if (!dynamicMapPromise) {
        dynamicMapPromise = import('lucide-react/dynamicIconImports').then(
            (mod) => {
                const anyMod = mod as unknown as {
                    default?: Record<
                        string,
                        () => Promise<{ default: SvgComp }>
                    >;
                    dynamicIconImports?: Record<
                        string,
                        () => Promise<{ default: SvgComp }>
                    >;
                };
                return anyMod.default ?? anyMod.dynamicIconImports ?? {};
            },
        );
    }
    return dynamicMapPromise;
}

export function toIconCandidates(name: string): string[] {
    const toKebab = (s: string) =>
        s
            .replace(/Icon$/i, '')
            .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
            .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
            .replace(/[\s_]+/g, '-')
            .replace(/([a-zA-Z])(\d)/g, '$1-$2')
            .replace(/(\d)([a-zA-Z])/g, '$1-$2')
            .toLowerCase();

    return Array.from(
        new Set([
            name,
            name.replace(/Icon$/i, ''),
            name.toLowerCase(),
            toKebab(name),
            toKebab(name.replace(/Icon$/i, '')),
        ]),
    );
}

export function getIconComponentSync(name: string): SvgComp | undefined {
    const candidates = toIconCandidates(name);
    for (const key of candidates) {
        const comp = registry.get(key);
        if (comp) return comp;
    }
    return undefined;
}

export async function loadIcon(name: string): Promise<SvgComp | undefined> {
    const existing = getIconComponentSync(name);
    if (existing) return existing;
    try {
        const map = await getDynamicMap();
        const candidates = toIconCandidates(name);
        for (const key of candidates) {
            const importer = map[key];
            if (importer) {
                const mod = await importer();
                const comp = (mod && (mod.default as SvgComp)) || undefined;
                if (comp) {
                    registry.set(key, comp);
                    return comp;
                }
            }
        }
    } catch {
        // ignore
    }
    return undefined;
}

export async function prefetchIcons(names: string[]): Promise<void> {
    if (!Array.isArray(names) || names.length === 0) return;
    try {
        const map = await getDynamicMap();
        const tasks: Promise<unknown>[] = [];
        const seen = new Set<string>();
        for (const raw of names) {
            for (const key of toIconCandidates(String(raw || ''))) {
                if (seen.has(key)) continue;
                seen.add(key);
                const importer = map[key];
                if (importer) {
                    tasks.push(
                        importer()
                            .then((mod) => {
                                const comp =
                                    (mod && (mod.default as SvgComp)) ||
                                    undefined;
                                if (comp) registry.set(key, comp);
                            })
                            .catch(() => void 0),
                    );
                }
            }
        }
        if (tasks.length) await Promise.allSettled(tasks);
    } catch {
        // ignore
    }
}
