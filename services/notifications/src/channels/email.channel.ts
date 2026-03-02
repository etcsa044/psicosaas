import { INotificationChannel, NotificationPayload } from './channel.interface';
import { logger } from '@config/logger';

/**
 * Email channel — placeholder for Nodemailer / SendGrid / AWS SES.
 * In development mode, messages are logged to console.
 */
export class EmailChannel implements INotificationChannel {
    readonly channelName = 'email';

    async send(payload: NotificationPayload): Promise<{ success: boolean; externalId?: string; error?: string }> {
        try {
            const smtpHost = process.env.SMTP_HOST;

            if (!smtpHost) {
                logger.info(`[Email DEV] To: ${payload.recipientEmail} | Template: ${payload.templateName}`, {
                    data: payload.templateData,
                });
                return { success: true, externalId: `dev_email_${Date.now()}` };
            }

            // Production: integrate with Nodemailer/SendGrid/SES
            // const transporter = nodemailer.createTransport(...)
            // await transporter.sendMail(...)
            logger.warn('Email production transport not configured yet');
            return { success: false, error: 'Email transport not configured' };
        } catch (error: any) {
            logger.error('Email send error:', error);
            return { success: false, error: error.message };
        }
    }
}
