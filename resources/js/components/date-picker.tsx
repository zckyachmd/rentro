'use client';

import { CalendarIcon } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

function formatDate(date: Date | undefined, locale?: string) {
    if (!date) {
        return '';
    }
    return date.toLocaleDateString(locale || 'en-US', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    });
}

function isValidDate(date: Date | undefined) {
    if (!date) {
        return false;
    }
    return !isNaN(date.getTime());
}

function parseISODate(str?: string | null): Date | undefined {
    if (!str) return undefined;
    const d = new Date(str);
    return isValidDate(d) ? d : undefined;
}

function toISODateString(date: Date | undefined): string | null {
    if (!date || !isValidDate(date)) return null;
    // YYYY-MM-DD
    return date.toISOString().slice(0, 10);
}

export interface DatePickerInputProps {
    id?: string;
    name?: string;
    value?: string | null; // YYYY-MM-DD
    onChange?: (value: string | null) => void;
    placeholder?: string;
    locale?: string;
    required?: boolean;
    disabled?: boolean;
    min?: string;
    max?: string;
}

export function DatePickerInput(props: DatePickerInputProps) {
    const {
        id,
        name,
        value,
        onChange,
        placeholder,
        locale,
        required,
        disabled,
        min,
        max,
    } = props;

    const [open, setOpen] = React.useState(false);
    // Controlled value as Date
    const selectedDate = parseISODate(value);
    const [month, setMonth] = React.useState<Date | undefined>(selectedDate);

    // Prevent infinite update loop by tracking previous value
    const prevSelectedRef = React.useRef<string | null>(null);
    React.useEffect(() => {
        const next = value ?? null;
        if (prevSelectedRef.current !== next) {
            prevSelectedRef.current = next;
            if (selectedDate) setMonth(selectedDate);
        }
    }, [value, selectedDate]);

    const displayValue = selectedDate ? formatDate(selectedDate, locale) : '';

    // min/max as Date, if provided
    const minDate = min ? parseISODate(min) : undefined;
    const maxDate = max ? parseISODate(max) : undefined;

    return (
        <div className="relative flex gap-2">
            {/* Visible input (readOnly) */}
            <Input
                id={id}
                value={displayValue}
                placeholder={placeholder}
                className="bg-background pr-10"
                readOnly
                tabIndex={0}
                required={required}
                disabled={disabled}
                onKeyDown={(e) => {
                    if (e.key === 'ArrowDown' && !disabled) {
                        e.preventDefault();
                        setOpen(true);
                    }
                }}
                onClick={() => {
                    if (!disabled) setOpen(true);
                }}
                autoComplete="off"
            />
            {/* Hidden input for form submission */}
            <input
                type="hidden"
                id={id}
                name={name}
                value={value || ''}
                required={required}
                disabled={disabled}
            />
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        id={id ? `${id}-picker` : 'date-picker'}
                        variant="ghost"
                        className="absolute right-2 top-1/2 size-6 -translate-y-1/2"
                        tabIndex={-1}
                        disabled={disabled}
                    >
                        <CalendarIcon className="size-3.5" />
                        <span className="sr-only">Select date</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-auto overflow-hidden p-0"
                    align="end"
                    alignOffset={-8}
                    sideOffset={10}
                >
                    <Calendar
                        mode="single"
                        selected={selectedDate}
                        captionLayout="dropdown"
                        month={month}
                        onMonthChange={setMonth}
                        onSelect={(date) => {
                            setOpen(false);
                            if (onChange) {
                                onChange(toISODateString(date));
                            }
                        }}
                        fromDate={minDate}
                        toDate={maxDate}
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full rounded-none border-t text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => {
                            setOpen(false);
                            onChange?.(null);
                        }}
                    >
                        Clear
                    </Button>
                </PopoverContent>
            </Popover>
        </div>
    );
}
