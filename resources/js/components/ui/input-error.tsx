export type InputErrorProps = {
  message?: string | string[];
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
export default function InputError({ message, className = '', reserveSpace = true }: InputErrorProps) {
  const text = Array.isArray(message) ? (message[0] ?? '') : (message ?? '');
  const content = text === '' && reserveSpace ? '\u00A0' : text;

  return (
    <p className={`text-xs text-destructive ${reserveSpace ? 'h-4' : ''} ${className}`.trim()}>
      {content}
    </p>
  );
}
