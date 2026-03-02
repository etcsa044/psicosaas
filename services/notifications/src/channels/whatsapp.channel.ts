import { INotificationChannel, NotificationPayload } from './channel.interface';
import { logger } from '@config/logger';

/**
 * WhatsApp channel — integrates with WhatsApp Business API.
 * In development mode, messages are logged to console.
 */
export class WhatsAppChannel implements INotificationChannel {
    readonly channelName = 'whatsapp';

    async send(payload: NotificationPayload): Promise<{ success: boolean; externalId?: string; error?: string }> {
        try {
            const apiUrl = process.env.WHATSAPP_API_URL;
            const apiToken = process.env.WHATSAPP_API_TOKEN;

            if (!apiUrl || !apiToken) {
                // Development mode — log instead of sending
                logger.info(`[WhatsApp DEV] To: ${payload.recipientPhone} | Template: ${payload.templateName}`, {
                    data: payload.templateData,
                });
                return { success: true, externalId: `dev_wa_${Date.now()}` };
            }

            // Production: call WhatsApp Business API
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: payload.recipientPhone,
                    type: 'template',
                    template: {
                        name: payload.templateName,
                        language: { code: 'es_AR' },
                        components: [
                            {
                                type: 'body',
                                parameters: Object.values(payload.templateData).map((val) => ({
                                    type: 'text',
                                    text: val,
                                })),
                            },
                        ],
                    },
                }),
            });

            const data = await response.json() as any;
            if (response.ok) {
                return { success: true, externalId: data.messages?.[0]?.id };
            }
            return { success: false, error: JSON.stringify(data) };
        } catch (error: any) {
            logger.error('WhatsApp send error:', error);
            return { success: false, error: error.message };
        }
    }
}
