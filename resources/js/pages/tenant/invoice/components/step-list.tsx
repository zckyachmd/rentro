import { useTranslation } from 'react-i18next';

import { Section } from '@/pages/tenant/invoice/components';

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
    return (
        <div className="flex items-start gap-3">
            <div className="bg-primary/10 text-primary mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold">
                {n}
            </div>
            <div>
                <div className="text-[13px] font-medium">{title}</div>
                <div className="text-muted-foreground text-xs">{desc}</div>
            </div>
        </div>
    );
}

export default function StepList({ isManualFlow }: { isManualFlow: boolean }) {
    const { t: tInv } = useTranslation('tenant/invoice');
    return (
        <Section title={tInv('steps.title')} subtitle={tInv('steps.subtitle')}>
            {isManualFlow ? (
                <div className="space-y-2">
                    <Step
                        n={1}
                        title={tInv('steps.manual.1.title')}
                        desc={tInv('steps.manual.1.desc')}
                    />
                    <Step
                        n={2}
                        title={tInv('steps.manual.2.title')}
                        desc={tInv('steps.manual.2.desc')}
                    />
                    <Step
                        n={3}
                        title={tInv('steps.manual.3.title')}
                        desc={tInv('steps.manual.3.desc')}
                    />
                    <Step
                        n={4}
                        title={tInv('steps.manual.4.title')}
                        desc={tInv('steps.manual.4.desc')}
                    />
                </div>
            ) : (
                <div className="space-y-2">
                    <Step
                        n={1}
                        title={tInv('steps.va.1.title')}
                        desc={tInv('steps.va.1.desc')}
                    />
                    <Step
                        n={2}
                        title={tInv('steps.va.2.title')}
                        desc={tInv('steps.va.2.desc')}
                    />
                    <Step
                        n={3}
                        title={tInv('steps.va.3.title')}
                        desc={tInv('steps.va.3.desc')}
                    />
                </div>
            )}
        </Section>
    );
}
