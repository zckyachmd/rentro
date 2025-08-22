import * as React from 'react';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';

function getCsrfToken(): string | null {
  const meta = document.querySelector(
    'meta[name="csrf-token"]',
  ) as HTMLMetaElement | null;
  if (meta?.content) return meta.content;
  const match = document.cookie
    .split('; ')
    .find((c) => c.startsWith('XSRF-TOKEN='));
  if (!match) return null;
  const raw = match.split('=')[1];
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export type UseConfirmPasswordDialogReturn = {
  confirmForm: ReturnType<typeof useForm<{ password: string }>>;
  show: boolean;
  setShow: React.Dispatch<React.SetStateAction<boolean>>;
  submitting: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
};

/**
 * Hook untuk menangani seluruh logic pada ConfirmPasswordDialog
 * (state, effect focus/reset, dan submit handling).
 */
export function useConfirmPasswordDialog(
  open: boolean,
  onClose: () => void,
  onConfirmed?: () => void,
): UseConfirmPasswordDialogReturn {
  const confirmForm = useForm<{ password: string }>({ password: '' });
  const [show, setShow] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setShow(false);
      confirmForm.reset('password');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const token = getCsrfToken();
    if (!token) {
      toast.error('CSRF token tidak ditemukan.');
      return;
    }

    try {
      setSubmitting(true);
      // @ts-ignore route helper global dari Ziggy
      const url = route('password.confirm');
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token,
          'X-XSRF-TOKEN': token,
          'X-Inertia': 'true',
          'X-Requested-With': 'XMLHttpRequest',
          Accept: 'application/json',
        },
        body: JSON.stringify({ password: confirmForm.data.password }),
        credentials: 'same-origin',
      });

      if (res.status === 204) {
        confirmForm.clearErrors();
        confirmForm.reset('password');
        onClose();
        onConfirmed?.();
        return;
      }

      if (res.status === 422) {
        let message = 'Password tidak valid.';
        try {
          const data = await res.json();
          const err = data?.errors?.password?.[0];
          if (typeof err === 'string') message = err;
        } catch {}
        confirmForm.setError('password', message);
        toast.error(message);
        return;
      }

      toast.error('Gagal mengkonfirmasi password. Coba lagi.');
    } catch {
      toast.error('Gagal mengkonfirmasi password. Periksa koneksi Anda.');
    } finally {
      setSubmitting(false);
    }
  };

  return { confirmForm, show, setShow, submitting, inputRef, onSubmit } as const;
}

/**
 * Controller untuk kebutuhan buka/tutup modal konfirmasi password
 * dan memutuskan apakah konfirmasi diperlukan dari backend.
 * Tidak merender JSX (hindari circular dependency dengan komponen).
 */
export function useConfirmPasswordModal() {
  const [open, setOpen] = React.useState(false);
  const pendingRef = React.useRef<null | (() => void)>(null);

  const openConfirm = async (run: () => void) => {
    try {
      // @ts-ignore Ziggy
      const url = route('password.confirm.needs');
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          Accept: 'application/json',
        },
        credentials: 'same-origin',
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.required === false) {
          run();
          return;
        }
        if (data && data.required === true) {
          pendingRef.current = run;
          setOpen(true);
          return;
        }
      }

      pendingRef.current = run;
      setOpen(true);
    } catch {
      pendingRef.current = run;
      setOpen(true);
    }
  };

  const handleConfirmed = () => {
    const fn = pendingRef.current;
    pendingRef.current = null;
    if (typeof fn === 'function') fn();
  };

  return { open, setOpen, openConfirm, handleConfirmed } as const;
}
