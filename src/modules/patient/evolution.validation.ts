import { z } from 'zod';

export const createEvolutionSchema = z.object({
    date: z.string().datetime().optional(),
    title: z.string().min(1, 'Title is required').max(200).trim(),
    content: z.string().min(1, 'Content is required'),
    tags: z.array(z.string().trim()).optional(),
    appointmentId: z.string().optional(),
});

export const updateEvolutionSchema = z.object({
    date: z.string().datetime().optional(),
    title: z.string().min(1).max(200).trim().optional(),
    content: z.string().min(1).optional(),
    tags: z.array(z.string().trim()).optional(),
    appointmentId: z.string().optional(),
});

export const createDocumentSchema = z.object({
    fileUrl: z.string().url('A valid file URL is required'),
    fileName: z.string().min(1, 'File name is required').trim(),
    type: z.enum(['informe', 'estudio', 'receta', 'documento', 'otro']).optional(),
});
