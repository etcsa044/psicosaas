import { z } from 'zod';

export const createPatientSchema = z.object({
    personalInfo: z.object({
        firstName: z.string().min(1).max(100).trim(),
        lastName: z.string().min(1).max(100).trim(),
        dni: z.string().optional(),
        birthDate: z.string().datetime().optional(),
        gender: z.enum(['M', 'F', 'NB', 'other', 'undisclosed']).optional(),
        phone: z.string().min(1, 'Phone is required').trim(),
        email: z.string().email('Email is required and must be valid'),
        address: z
            .object({
                street: z.string().max(200).optional(),
                city: z.string().max(100).optional(),
                province: z.string().max(100).optional(),
                zipCode: z.string().max(20).optional(),
            })
            .optional(),
    }),
    emergencyContact: z
        .object({
            name: z.string().max(200).optional(),
            phone: z.string().optional(),
            relationship: z.string().max(100).optional(),
        })
        .optional(),
    insuranceInfo: z
        .object({
            provider: z.string().max(200).optional(),
            planName: z.string().max(200).optional(),
            memberNumber: z.string().optional(),
        })
        .optional(),
    generalObservations: z.string().max(5000).optional(),
    patientType: z.enum(['semanal', 'quincenal', 'mensual', 'personalizado']).optional(),
});

export const updatePatientSchema = createPatientSchema.partial();

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
