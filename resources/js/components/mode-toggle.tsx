'use client';

import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, Monitor, Moon, Sun } from 'lucide-react';

export function ModeToggle() {
    const { theme, setTheme } = useTheme();

    const isActive = (value: 'light' | 'dark' | 'system') => theme === value;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    aria-label="Toggle theme"
                    className="relative"
                >
                    {/* Icon swap */}
                    <Sun className="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 transition-transform duration-200 dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 transition-transform duration-200 dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Theme
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem
                    className="gap-2 pr-2"
                    onClick={() => setTheme('light')}
                    aria-checked={isActive('light')}
                    role="menuitemradio"
                >
                    <Sun className="h-4 w-4" />
                    <div className="flex flex-1 flex-col leading-tight">
                        <span>Light</span>
                        <span className="text-[10px] text-muted-foreground">
                            Use light theme
                        </span>
                    </div>
                    {isActive('light') && (
                        <Check className="h-4 w-4 opacity-100" />
                    )}
                </DropdownMenuItem>

                <DropdownMenuItem
                    className="gap-2 pr-2"
                    onClick={() => setTheme('dark')}
                    aria-checked={isActive('dark')}
                    role="menuitemradio"
                >
                    <Moon className="h-4 w-4" />
                    <div className="flex flex-1 flex-col leading-tight">
                        <span>Dark</span>
                        <span className="text-[10px] text-muted-foreground">
                            Use dark theme
                        </span>
                    </div>
                    {isActive('dark') && (
                        <Check className="h-4 w-4 opacity-100" />
                    )}
                </DropdownMenuItem>

                <DropdownMenuItem
                    className="gap-2 pr-2"
                    onClick={() => setTheme('system')}
                    aria-checked={isActive('system')}
                    role="menuitemradio"
                >
                    <Monitor className="h-4 w-4" />
                    <div className="flex flex-1 flex-col leading-tight">
                        <span>Auto</span>
                        <span className="text-[10px] text-muted-foreground">
                            Follow system appearance
                        </span>
                    </div>
                    {isActive('system') && (
                        <Check className="h-4 w-4 opacity-100" />
                    )}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
