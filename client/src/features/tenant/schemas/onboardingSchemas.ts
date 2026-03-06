import { z } from 'zod';

export const onboardingStep1Schema = z.object({
    nombrePublico: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    country: z.enum(['AR', 'CL', 'MX', 'CO', 'ES', 'UY'] as const, {
        message: 'Seleccioná un país válido'
    }),
});

export const onboardingStep2Schema = z.object({
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color hexadecimal inválido'),
    logoUrl: z.string().url('URL inválida').optional().or(z.literal('')),
});

export const onboardingStep3Schema = z.object({
    nombreDelBot: z.string().min(2, 'El nombre del bot debe tener al menos 2 caracteres'),
    tonoDelBot: z.enum(['formal', 'calido', 'neutro']),
});

export const onboardingFullSchema = onboardingStep1Schema
    .merge(onboardingStep2Schema)
    .merge(onboardingStep3Schema);

export type OnboardingFormData = z.infer<typeof onboardingFullSchema>;
