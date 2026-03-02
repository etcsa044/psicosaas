import { NotificationPayload, INotificationChannel } from '../channels/channel.interface';
import { WhatsAppChannel } from '../channels/whatsapp.channel';
import { EmailChannel } from '../channels/email.channel';
import { renderTemplate } from '../templates/notification.templates';
import { logger } from '@config/logger';

const channels: Record<string, INotificationChannel> = {
    whatsapp: new WhatsAppChannel(),
    email: new EmailChannel(),
};

export interface QueuedNotification {
    payload: NotificationPayload;
    attempts: number;
    lastAttemptAt?: Date;
    status: 'pending' | 'sent' | 'failed';
    error?: string;
}

// In-memory queue for MVP — replace with Redis/SQS/Bull in production
const notificationQueue: QueuedNotification[] = [];

export class NotificationService {
    /**
     * Send a notification immediately.
     */
    async send(payload: NotificationPayload): Promise<void> {
        const channel = channels[payload.channel];
        if (!channel) {
            logger.warn(`Unknown notification channel: ${payload.channel}`);
            return;
        }

        const result = await channel.send(payload);
        if (result.success) {
            logger.info(`Notification sent via ${payload.channel}`, {
                tenantId: payload.tenantId,
                template: payload.templateName,
                externalId: result.externalId,
            });
        } else {
            logger.error(`Notification failed via ${payload.channel}`, {
                tenantId: payload.tenantId,
                template: payload.templateName,
                error: result.error,
            });
        }
    }

    /**
     * Queue a notification for later processing.
     */
    enqueue(payload: NotificationPayload): void {
        notificationQueue.push({
            payload,
            attempts: 0,
            status: 'pending',
        });
        logger.debug('Notification queued', {
            tenantId: payload.tenantId,
            template: payload.templateName,
            scheduledFor: payload.scheduledFor,
        });
    }

    /**
     * Process the queue — call periodically via cron/interval.
     * In production, use Bull/BullMQ with Redis.
     */
    async processQueue(): Promise<void> {
        const now = new Date();
        const pendingItems = notificationQueue.filter(
            (item) => item.status === 'pending' &&
                (!item.payload.scheduledFor || item.payload.scheduledFor <= now)
        );

        for (const item of pendingItems) {
            item.attempts++;
            item.lastAttemptAt = now;

            try {
                await this.send(item.payload);
                item.status = 'sent';
            } catch (error: any) {
                item.error = error.message;
                if (item.attempts >= 3) {
                    item.status = 'failed';
                    logger.error('Notification permanently failed after 3 attempts', {
                        tenantId: item.payload.tenantId,
                        template: item.payload.templateName,
                    });
                }
            }
        }

        // Cleanup sent items older than 1 hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const cleanupIndex = notificationQueue.findIndex(
            (item) => item.status === 'sent' && item.lastAttemptAt && item.lastAttemptAt < oneHourAgo
        );
        if (cleanupIndex >= 0) {
            notificationQueue.splice(cleanupIndex, 1);
        }
    }

    /**
     * Helper: send appointment reminder
     */
    async sendAppointmentReminder(
        tenantId: string,
        phone: string,
        templateName: string,
        data: Record<string, string>
    ): Promise<void> {
        await this.send({
            tenantId,
            recipientPhone: phone,
            channel: 'whatsapp',
            templateName,
            templateData: data,
        });
    }

    getQueueStatus(): { pending: number; sent: number; failed: number } {
        return {
            pending: notificationQueue.filter((i) => i.status === 'pending').length,
            sent: notificationQueue.filter((i) => i.status === 'sent').length,
            failed: notificationQueue.filter((i) => i.status === 'failed').length,
        };
    }
}

export const notificationService = new NotificationService();
