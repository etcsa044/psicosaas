import { config } from '@config/index';
import { connectDatabase, disconnectDatabase } from '@config/database';
import { logger } from '@config/logger';
import { seedPermissions } from '@modules/rbac/rbac.seed';
import app from './app';

async function bootstrap(): Promise<void> {
    try {
        // Connect to MongoDB
        await connectDatabase();

        // Seed permissions (idempotent)
        await seedPermissions();

        // Start HTTP server
        const server = app.listen(config.port, () => {
            logger.info(`🚀 PsicoSaaS API running on port ${config.port} [${config.env}]`);
        });

        // ── Graceful shutdown ──
        const shutdown = async (signal: string) => {
            logger.info(`${signal} received. Starting graceful shutdown...`);

            server.close(async () => {
                logger.info('HTTP server closed');
                await disconnectDatabase();
                logger.info('All connections closed. Exiting.');
                process.exit(0);
            });

            // Force exit after 10 seconds
            setTimeout(() => {
                logger.error('Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

        // ── Unhandled errors ──
        process.on('unhandledRejection', (reason: any) => {
            logger.error('Unhandled Rejection:', reason);
        });

        process.on('uncaughtException', (error: Error) => {
            logger.error('Uncaught Exception:', error);
            process.exit(1);
        });
    } catch (error) {
        logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

bootstrap();
