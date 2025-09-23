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
import { formatDate } from '@/lib/format';

function isValidDate(date: Date | undefined) {
    if (!date) {
        return false;
    }
    return !isNaN(date.getTime());
}

function parseISODate(str?: string | null): Date | undefined {
    if (!str) return undefined;
    // Expect YYYY-MM-DD; parse as LOCAL date to avoid TZ shift
    const parts = str.split('-');
    if (parts.length !== 3) return undefined;
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const d = Number(parts[2]);
    if (!y || !m || !d) return undefined;
    const local = new Date(y, m - 1, d); // local midnight
    return isValidDate(local) ? local : undefined;
}

function toISODateString(date: Date | undefined): string | null {
    if (!date || !isValidDate(date)) return null;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
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

    const displayValue = selectedDate
        ? formatDate(selectedDate, false, locale)
        : '';

    // min/max as Date, if provided
    const minDate = min ? parseISODate(min) : undefined;
    const maxDate = max ? parseISODate(max) : undefined;

    return (
        <div className="relative">
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
                        className="absolute top-1/2 right-3 h-6 w-6 -translate-y-1/2 p-0"
                        tabIndex={-1}
                        disabled={disabled}
                    >
                        <CalendarIcon className="size-4" />
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
                        disabled={[
                            ...(minDate ? [{ before: minDate }] : []),
                            ...(maxDate ? [{ after: maxDate }] : []),
                        ]}
                        onSelect={(date) => {
                            // Guard: ignore selection if out of range
                            if (
                                date &&
                                ((minDate && date < minDate) ||
                                    (maxDate && date > maxDate))
                            ) {
                                return; // do nothing
                            }
                            setOpen(false);
                            onChange?.(toISODateString(date));
                        }}
                        fromDate={minDate}
                        toDate={maxDate}
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground w-full rounded-none border-t text-xs"
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
