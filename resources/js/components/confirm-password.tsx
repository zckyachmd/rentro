import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';
import { useConfirmPasswordDialog } from '@/hooks/use-confirm-password';
export { useConfirmPasswordModal } from '@/hooks/use-confirm-password';

export type ConfirmPasswordDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirmed?: () => void;
    title?: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
};

export function ConfirmPasswordDialog({
    open,
    onOpenChange,
    onConfirmed,
    title = 'Konfirmasi Password',
    description = 'Demi keamanan, masukkan password Anda untuk melanjutkan aksi ini.',
    confirmLabel = 'Konfirmasi',
    cancelLabel = 'Batal',
}: ConfirmPasswordDialogProps) {
    const { confirmForm, show, setShow, submitting, inputRef, onSubmit } =
        useConfirmPasswordDialog(open, () => onOpenChange(false), onConfirmed);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="animate-none">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-3">
                    <div className="space-y-2">
                        <Label htmlFor="confirm_password">Password</Label>
                        <div className="relative">
                            <Input
                                id="confirm_password"
                                ref={inputRef}
                                type={show ? 'text' : 'password'}
                                value={confirmForm.data.password}
                                className="pr-10"
                                onChange={(e) =>
                                    confirmForm.setData(
                                        'password',
                                        e.target.value,
                                    )
                                }
                                autoComplete="current-password"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setShow((s) => !s)}
                                className="absolute right-0 top-0 h-full border-0 px-3 hover:bg-transparent focus-visible:outline-none focus-visible:ring-0"
                                tabIndex={-1}
                                aria-label={
                                    show ? 'Hide password' : 'Show password'
                                }
                            >
                                {show ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        {confirmForm.errors.password && (
                            <p className="text-sm text-destructive" role="alert">
                                {confirmForm.errors.password}
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={submitting}
                        >
                            {cancelLabel}
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {confirmLabel}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default ConfirmPasswordDialog;
