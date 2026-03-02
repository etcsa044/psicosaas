import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email('Por favor, ingresá un email válido'),
    password: z.string().min(1, 'La contraseña es requerida'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
    email: z.string().email('Por favor, ingresá un email válido'),
    password: z
        .string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula')
        .regex(/[0-9]/, 'La contraseña debe contener al menos un número'),
    confirmPassword: z.string().min(1, 'Confirmá tu contraseña'),
    firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;
