import winston from 'winston';
import { config } from './index';

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    config.isProduction
        ? winston.format.json()
        : winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
                const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
                return `${timestamp} [${level}]: ${message}${metaStr}`;
            })
        )
);

export const logger = winston.createLogger({
    level: config.logging.level,
    format: logFormat,
    defaultMeta: { service: 'psicosaas-api' },
    transports: [
        new winston.transports.Console(),
        ...(config.isProduction
            ? [
                new winston.transports.File({ filename: 'logs/error.log', level: 'error', maxsize: 10485760, maxFiles: 5 }),
                new winston.transports.File({ filename: 'logs/combined.log', maxsize: 10485760, maxFiles: 5 }),
            ]
            : []),
    ],
});
