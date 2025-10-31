import type { TFunction } from 'i18next';

/**
 * Returns true when both dates are present and start > end.
 * Assumes ISO format YYYY-MM-DD or null.
 */
export function isRangeInvalid(
    start?: string | null,
    end?: string | null,
): boolean {
    if (!start || !end) return false;
    // string compare is valid for YYYY-MM-DD
    return start > end;
}

/**
 * Builds a localized error message using validation translations.
 * Relies on namespace 'validation' with key 'validation.before_or_equal'.
 */
export function buildRangeErrorMessage(
    t: TFunction,
    startLabel: string,
    endLabel: string,
): string {
    // Example: "Start date must be a date before or equal to End date."
    return t('validation.before_or_equal', {
        ns: 'validation',
        attribute: startLabel,
        date: endLabel,
        defaultValue: `${startLabel} must be before or equal to ${endLabel}.`,
    });
}
