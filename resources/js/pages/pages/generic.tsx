import { BlockRenderer, type Block } from '@/blocks/registry';
import PublicLayout from '@/layouts/public';

type Payload = {
    slug: string;
    meta: { title?: string; description?: string };
    fields: { body?: string; [key: string]: unknown };
    blocks: Block[];
};

export default function GenericPage(props: Payload) {
    const { meta, fields, blocks } = props;
    return (
        <PublicLayout title={meta?.title} description={meta?.description}>
            {typeof fields.body === 'string' && fields.body.length > 0 && (
                <div
                    className="prose dark:prose-invert mb-8 max-w-none"
                    dangerouslySetInnerHTML={{ __html: fields.body }}
                />
            )}
            <BlockRenderer blocks={blocks} />
        </PublicLayout>
    );
}
