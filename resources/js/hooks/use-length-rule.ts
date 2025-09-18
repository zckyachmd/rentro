import React from 'react';

export type LengthRuleOptions = {
    min?: number;
    max?: number;
    trim?: boolean;
    required?: boolean; // if true: length > 0 and >= min (if provided). if false: empty allowed.
};

export function useLengthRule(value: string | undefined, opts: LengthRuleOptions = {}) {
    const { min, max, trim = true, required = false } = opts;
    const val = typeof value === 'string' ? value : '';
    const length = trim ? val.trim().length : val.length;

    const meetsMin = typeof min === 'number' ? length >= min : true;
    const withinMax = typeof max === 'number' ? length <= max : true;
    const belowMin = typeof min === 'number' ? length < min : false;
    const overMax = typeof max === 'number' ? length > max : false;

    // When required = true: non-empty is required and must satisfy min (if provided)
    // When required = false: empty is allowed; if not empty and min is provided, must satisfy min
    const hasContent = length > 0;
    const validWhenRequired = (typeof min === 'number' ? meetsMin : hasContent) && withinMax;
    const validWhenOptional = (!hasContent || meetsMin) && withinMax;
    const valid = required ? validWhenRequired : validWhenOptional;

    const limit = (typeof max === 'number' ? max : typeof min === 'number' ? min : null) as
        | number
        | null;

    return {
        length,
        meetsMin,
        withinMax,
        belowMin,
        overMax,
        valid,
        limit,
    } as const;
}

