import { Router, Request, Response, NextFunction } from 'express';
import { botService } from './bot.service';
import { logger } from '@config/logger';
import Branding from '@modules/branding/models/branding.model';
import Tenant from '@modules/tenant/models/tenant.model';

const router = Router();

/**
 * WhatsApp Webhook Verification (GET) — required by Meta
 */
router.get('/webhook', (req: Request, res: Response) => {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === verifyToken) {
        logger.info('WhatsApp webhook verified');
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

/**
 * WhatsApp Webhook Messages (POST)
 */
router.post('/webhook', async (req: Request, res: Response, _next: NextFunction) => {
    try {
        // Always respond 200 quickly to WhatsApp
        res.sendStatus(200);

        const body = req.body;
        if (!body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) return;

        const entry = body.entry[0].changes[0].value;
        const message = entry.messages[0];

        if (message.type !== 'text') return; // Only handle text messages

        const userPhone = message.from;
        const messageText = message.text.body;
        const waBusinessId = entry.metadata?.phone_number_id;

        // Find tenant by WhatsApp Business ID (in production, map via config)
        // For now, use a simple lookup — in production this should be cached
        const tenant = await Tenant.findOne({ 'country.code': { $exists: true } }).lean();
        if (!tenant) {
            logger.warn('No tenant found for WhatsApp message', { userPhone });
            return;
        }

        const tenantId = tenant.tenantId;

        // Get branding/bot config
        const branding = await Branding.findOne({ tenantId }).lean();
        const botConfig = {
            name: branding?.nombreDelBot || 'Asistente Virtual',
            tone: branding?.tonoDelBot || 'neutro',
            professionalName: branding?.nombrePublico || 'el profesional',
        };

        // Process message through bot pipeline
        const result = await botService.processMessage({
            tenantId,
            userPhone,
            message: messageText,
            sessionId: `wa_${userPhone}_${Date.now()}`,
            botConfig,
        });

        // Send response back via WhatsApp API
        const apiUrl = process.env.WHATSAPP_API_URL;
        const apiToken = process.env.WHATSAPP_API_TOKEN;

        if (apiUrl && apiToken) {
            await fetch(`${apiUrl}/${waBusinessId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: userPhone,
                    type: 'text',
                    text: { body: result.response },
                }),
            });
        } else {
            logger.info(`[Bot DEV Response] To: ${userPhone} | ${result.response}`);
        }
    } catch (error) {
        logger.error('WhatsApp webhook processing error:', error);
    }
});

export default router;
