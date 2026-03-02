import mongoose from 'mongoose';
import { config } from './index';
import { logger } from './logger';

export async function connectDatabase(): Promise<void> {
    try {
        await mongoose.connect(config.mongodb.uri, {
            maxPoolSize: 10,
            minPoolSize: 2,
            socketTimeoutMS: 45000,
            serverSelectionTimeoutMS: 5000,
        });

        logger.info('✅ MongoDB connected successfully');

        mongoose.connection.on('error', (err) => {
            logger.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected');
        });
    } catch (error) {
        logger.error('❌ MongoDB connection failed:', error);
        process.exit(1);
    }
}

export async function disconnectDatabase(): Promise<void> {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected gracefully');
}
