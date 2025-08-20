import type { Theme } from '@/hooks/use-appearance';
import { useAppearance } from '@/hooks/use-appearance';
import { createContext, useContext, useMemo } from 'react';

export type ThemeProviderProps = {
    children: React.ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
};

export type ThemeProviderState = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    resolvedTheme: 'light' | 'dark';
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(
    undefined,
);

export function ThemeProvider({
    children,
    defaultTheme = 'system',
    storageKey = 'vite-ui-theme',
}: ThemeProviderProps) {
    const { theme, setTheme, resolvedTheme } = useAppearance({
        defaultTheme,
        storageKey,
    });

    const value = useMemo<ThemeProviderState>(
        () => ({ theme, setTheme, resolvedTheme }),
        [theme, resolvedTheme, setTheme],
    );

    return (
        <ThemeProviderContext.Provider value={value}>
            {children}
        </ThemeProviderContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeProviderContext);
    if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
    return ctx;
}
