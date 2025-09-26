import React from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { ContactDTO } from '@/types/profile';

export default function ContactDeleteDialog({
    target,
    onCancel,
    onConfirm,
}: {
    target: ContactDTO | null;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    const { t } = useTranslation();
    const { t: tProfile } = useTranslation('profile');
    const [agree, setAgree] = React.useState(false);

    React.useEffect(() => {
        if (target) {
            setAgree(false);
        }
    }, [target]);

    return (
        <Dialog open={!!target} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {tProfile('contact.delete_title')}
                    </DialogTitle>
                    <DialogDescription>
                        {target ? (
                            <>
                                {tProfile('contact.delete_desc_prefix')}{' '}
                                <b>{target.name}</b> ({target.relationship}).{' '}
                                {tProfile('contact.delete_desc_suffix')}
                            </>
                        ) : (
                            tProfile('contact.delete_desc_fallback')
                        )}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-start space-x-2 rounded-md border p-3">
                    <Checkbox
                        id="ack"
                        checked={agree}
                        onCheckedChange={(v) => setAgree(Boolean(v))}
                    />
                    <label
                        htmlFor="ack"
                        className="text-muted-foreground text-sm leading-snug"
                    >
                        {tProfile('contact.delete_ack')}
                    </label>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onCancel}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => {
                            onConfirm();
                            setAgree(false);
                        }}
                        disabled={!agree}
                    >
                        {t('common.delete')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
