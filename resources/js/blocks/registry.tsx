type FeatureItem = { title?: string; text?: string };
type HeroBlock = {
    type: 'hero';
    props?: { title?: string; subtitle?: string; imageUrl?: string };
};
type FeaturesBlock = { type: 'features'; props?: { items?: FeatureItem[] } };
type CtaBlock = { type: 'cta'; props?: { text?: string; href?: string } };
export type Block = HeroBlock | FeaturesBlock | CtaBlock;

function Hero({
    title,
    subtitle,
    imageUrl,
}: {
    title?: string;
    subtitle?: string;
    imageUrl?: string;
}) {
    return (
        <section className="relative overflow-hidden rounded-lg border">
            {imageUrl ? (
                <img
                    src={imageUrl}
                    alt={title || 'hero'}
                    className="absolute inset-0 h-full w-full object-cover opacity-30"
                />
            ) : null}
            <div className="relative p-12">
                {title && (
                    <h2 className="mb-2 text-3xl font-semibold">{title}</h2>
                )}
                {subtitle && (
                    <p className="text-muted-foreground">{subtitle}</p>
                )}
            </div>
        </section>
    );
}

function Features({ items }: { items?: FeatureItem[] }) {
    const data = items || [];
    return (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((it, i) => (
                <div key={i} className="rounded border p-4">
                    {it.title && (
                        <h3 className="mb-1 font-medium">{it.title}</h3>
                    )}
                    {it.text && (
                        <p className="text-muted-foreground text-sm">
                            {it.text}
                        </p>
                    )}
                </div>
            ))}
        </section>
    );
}

function Cta({ text, href }: { text?: string; href?: string }) {
    const label = text || 'Action';
    const link = href || '#';
    return (
        <section>
            <a
                className="bg-primary text-primary-foreground inline-flex items-center rounded px-4 py-2"
                href={link}
            >
                {label}
            </a>
        </section>
    );
}

const registry = {
    hero: (p: HeroBlock['props'] = {}) => <Hero {...p} />,
    features: (p: FeaturesBlock['props'] = {}) => <Features {...p} />,
    cta: (p: CtaBlock['props'] = {}) => <Cta {...p} />,
} as const;

export function BlockRenderer({ blocks }: { blocks: Block[] }) {
    if (!Array.isArray(blocks) || blocks.length === 0) return null;
    return (
        <div className="space-y-8">
            {blocks.map((b, i) => {
                const Comp = registry[b?.type as keyof typeof registry];
                if (!Comp) return null;
                return <Comp key={i} {...(b?.props || {})} />;
            })}
        </div>
    );
}
