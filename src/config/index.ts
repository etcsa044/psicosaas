import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function requireEnv(key: string, defaultValue?: string): string {
    const value = process.env[key] || defaultValue;
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

export const config = {
    env: requireEnv('NODE_ENV', 'development'),
    port: parseInt(requireEnv('PORT', '3000'), 10),

    mongodb: {
        uri: requireEnv('MONGODB_URI'),
    },

    redis: {
        url: process.env.REDIS_URL || '',
    },

    jwt: {
        accessSecret: requireEnv('JWT_ACCESS_SECRET'),
        refreshSecret: requireEnv('JWT_REFRESH_SECRET'),
        accessExpiration: requireEnv('JWT_ACCESS_EXPIRATION', '15m'),
        refreshExpiration: requireEnv('JWT_REFRESH_EXPIRATION', '7d'),
    },

    encryption: {
        key: requireEnv('ENCRYPTION_KEY'),
    },

    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },

    logging: {
        level: process.env.LOG_LEVEL || 'info',
    },

    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
} as const;
