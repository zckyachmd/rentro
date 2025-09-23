import { usePage } from '@inertiajs/react';

import type { PageProps } from '@/types';

export type InputErrorProps = {
  /**
   * Error message (string or array). If omitted, component will try to read
   * from Inertia errors using the `name` prop.
   */
  message?: string | string[];
  /**
   * Field name to lookup from Inertia page props errors (dot notation supported).
   */
  name?: string;
  className?: string;
  /**
   * When true, reserve vertical space even when there's no message.
   * Default: true (keeps layout from shifting)
   */
  reserveSpace?: boolean;
};

/**
 * InputError — komponen pesan error kecil untuk di bawah field form.
 * Secara default memiliki tinggi tetap (h-4) agar layout stabil saat error muncul/hilang.
 */
function readError(errors: unknown, path?: string): string {
  if (!path) return '';
  if (!errors || typeof errors !== 'object') return '';
  // Direct hit
  const direct = (errors as Record<string, unknown>)[path];
  let val: unknown = direct;
  // Try dot path traversal if direct not found
  if (val === undefined && path.includes('.')) {
    val = path.split('.').reduce<unknown>((acc, seg) => {
      if (acc && typeof acc === 'object') {
        return (acc as Record<string, unknown>)[seg];
      }
      return undefined;
    }, errors);
  }
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return String(val[0] ?? '');
  return '';
}

export default function InputError({ message, name, className = '', reserveSpace = true }: InputErrorProps) {
  const { props } = usePage<PageProps<{ errors?: Record<string, unknown> }>>();
  const resolved = message ?? (name ? readError(props?.errors, name) : '');
  const text = Array.isArray(resolved) ? (resolved[0] ?? '') : (resolved ?? '');
  const content = text === '' && reserveSpace ? '\u00A0' : text;

  return (
    <p className={`text-xs text-destructive ${reserveSpace ? 'h-4' : ''} ${className}`.trim()}>
      {content}
    </p>
  );
}
