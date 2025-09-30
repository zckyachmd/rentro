import { z } from 'zod';

export const pageEnum = z.enum(['home', 'about', 'privacy']);
export const localeEnum = z.enum(['id', 'en']);

export const saveSectionSchema = z.object({
    page: pageEnum,
    section: z.string().min(1),
    locale: localeEnum,
    values: z.record(z.string(), z.string().nullable()),
});

export type SaveSectionInput = z.infer<typeof saveSectionSchema>;

