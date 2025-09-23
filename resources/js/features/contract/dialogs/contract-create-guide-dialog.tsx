import { CalendarClock, Info, RefreshCw, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

export default function ContractCreateGuideDialog({
    prorata = false,
}: {
    prorata?: boolean;
}) {
    const { t } = useTranslation('management/contract');
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                    {t('create.guide.button')}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[720px]">
                <DialogHeader>
                    <DialogTitle>{t('create.guide.title')}</DialogTitle>
                    <DialogDescription>{t('create.guide.desc')}</DialogDescription>
                </DialogHeader>

                <div className="space-y-5 px-3 text-sm">
                    <div className="bg-muted/30 rounded-md border p-4">
                        <div className="mb-2 flex items-center gap-2 font-medium">
                            <Info className="size-4" /> {t('create.guide.flow.title')}
                </div>
                <ol className="ml-5 list-decimal space-y-1">
                            <li>{t('create.guide.flow.items.1')}</li>
                            <li>
                                {t('create.guide.flow.items.2')}
                            </li>
                            <li>
                                {t('create.guide.flow.items.3')}
                            </li>
                            <li>
                                {t('create.guide.flow.items.4')}
                            </li>
                            <li>
                                {t('create.guide.flow.items.5.prefix')}
                                <span className="block">{t('create.guide.flow.items.5.bulanan')}</span>
                                <span className="block">{t('create.guide.flow.items.5.lain')}</span>
                            </li>
                            <li>
                                {t('create.guide.flow.items.6')}
                            </li>
                        </ol>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-md border p-4">
                            <div className="mb-1 flex items-center gap-2 font-medium">
                                <ShieldCheck className="size-4" /> {t('create.guide.deposit.title')}
                            </div>
                            <ul className="text-muted-foreground ml-5 list-disc space-y-1">
                                <li>{t('create.guide.deposit.items.1')}</li>
                                <li>{t('create.guide.deposit.items.2')}</li>
                                <li>{t('create.guide.deposit.items.3')}</li>
                            </ul>
                        </div>

                        <div className="rounded-md border p-4">
                            <div className="mb-1 flex items-center gap-2 font-medium">
                                <ShieldCheck className="size-4" /> {t('create.guide.payment.title')}
                            </div>
                            <ul className="text-muted-foreground ml-5 list-disc space-y-1">
                                <li>{t('create.guide.payment.items.1')}</li>
                                <li>{t('create.guide.payment.items.2')}</li>
                                <li>{t('create.guide.payment.items.3')}</li>
                            </ul>
                        </div>

                        <div className="rounded-md border p-4">
                            <div className="mb-1 flex items-center gap-2 font-medium">
                                <RefreshCw className="size-4" /> {t('create.guide.autorenew.title')}
                            </div>
                            <ul className="text-muted-foreground ml-5 list-disc space-y-1">
                                <li>{t('create.guide.autorenew.items.1')}</li>
                                <li>{t('create.guide.autorenew.items.2')}</li>
                                <li>{t('create.guide.autorenew.items.3')}</li>
                            </ul>
                        </div>

                        <div className="rounded-md border p-4">
                            <div className="mb-1 flex items-center gap-2 font-medium">
                                <CalendarClock className="size-4" /> {t('create.guide.dates.title')}
                            </div>
                            <ul className="text-muted-foreground ml-5 list-disc space-y-1">
                                <li>{t('create.guide.dates.items.1')}</li>
                                {prorata ? (
                                    <>
                                        <li>{t('create.guide.dates.items.prorata.1')}</li>
                                        <li>{t('create.guide.dates.items.prorata.2')}</li>
                                    </>
                                ) : (
                                    <li>{t('create.guide.dates.items.no_prorata')}</li>
                                )}
                            </ul>
                        </div>
                    </div>

                    <Separator />

                    <div className="bg-muted/20 rounded-md border p-4">
                        <div className="mb-2 font-medium">{t('create.guide.tips.title')}</div>
                        <ul className="text-muted-foreground ml-5 list-disc space-y-1">
                            <li>{t('create.guide.tips.items.1')}</li>
                            <li>{t('create.guide.tips.items.2')}</li>
                            <li>{t('create.guide.tips.items.3')}</li>
                        </ul>
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                            (document.activeElement as HTMLElement)?.blur?.()
                        }
                    >
                        {t('common.cancel')}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
