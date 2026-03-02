import { z } from 'zod';

export const registerSchema = z.object({
    email: z.string().email('Invalid email format').toLowerCase().trim(),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .max(128)
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        ),
    profile: z.object({
        firstName: z.string().min(1).max(100).trim(),
        lastName: z.string().min(1).max(100).trim(),
        licenseNumber: z.string().optional(),
        phone: z.string().optional(),
    }),
    country: z
        .object({
            code: z.enum(['AR', 'CL', 'MX', 'CO', 'ES', 'UY']).default('AR'),
        })
        .optional(),
});

export const loginSchema = z.object({
    email: z.string().email().toLowerCase().trim(),
    password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
