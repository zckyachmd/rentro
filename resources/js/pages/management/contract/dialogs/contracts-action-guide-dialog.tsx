import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export default function ContractsActionGuideDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
}) {
    const { t } = useTranslation('management/contract');
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[640px]">
                <DialogHeader>
                    <DialogTitle>{t('guide.title')}</DialogTitle>
                    <DialogDescription>{t('guide.desc')}</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 text-sm">
                    <div>
                        <div className="font-medium">
                            {t('guide.checkin.title')}
                        </div>
                        <ul className="text-muted-foreground mt-1 list-inside list-disc">
                            <li>{t('guide.checkin.a1')}</li>
                            <li>{t('guide.checkin.a2')}</li>
                            <li>{t('guide.checkin.a3')}</li>
                            <li>{t('guide.checkin.a4')}</li>
                        </ul>
                    </div>
                    <div>
                        <div className="font-medium">
                            {t('guide.checkout.title')}
                        </div>
                        <ul className="text-muted-foreground mt-1 list-inside list-disc">
                            <li>{t('guide.checkout.a1')}</li>
                            <li>{t('guide.checkout.a2')}</li>
                            <li>{t('guide.checkout.a3')}</li>
                            <li>{t('guide.checkout.a4')}</li>
                        </ul>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        {t('common.close')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
