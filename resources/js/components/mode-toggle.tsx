'use client';

import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import * as React from 'react';

export function ModeToggle() {
    const { setTheme, resolvedTheme } = useTheme() as {
        theme: 'light' | 'dark' | 'system';
        setTheme: (t: 'light' | 'dark' | 'system') => void;
        resolvedTheme: 'light' | 'dark';
    };

    const handleToggle = React.useCallback(() => {
        if (resolvedTheme === 'dark') setTheme('light');
        else setTheme('dark');
    }, [resolvedTheme, setTheme]);

    const isDark = resolvedTheme === 'dark';

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            aria-pressed={isDark}
            title={isDark ? 'Switch to light' : 'Switch to dark'}
            className="relative hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 motion-safe:transition-none"
            onClick={handleToggle}
        >
            <Sun
                aria-hidden="true"
                className={`h-[1.1rem] w-[1.1rem] transition-all duration-200 ease-in-out ${isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'} motion-reduce:transition-none`}
            />
            <Moon
                aria-hidden="true"
                className={`absolute h-[1.1rem] w-[1.1rem] transition-all duration-200 ease-in-out ${isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'} motion-reduce:transition-none`}
            />
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}
