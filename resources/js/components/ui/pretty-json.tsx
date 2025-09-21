import * as React from 'react';

export default function PrettyJson({
  value,
  className = 'max-h-[50vh] w-full min-w-0 overflow-auto rounded-md bg-muted p-3 text-xs font-mono whitespace-pre-wrap break-words wrap-anywhere'
}: {
  value?: unknown;
  className?: string;
}) {
  const str = React.useMemo(() => {
    try {
      return JSON.stringify(value ?? {}, null, 2);
    } catch {
      return String(value ?? '');
    }
  }, [value]);

  return <pre className={className}>{str}</pre>;
}

