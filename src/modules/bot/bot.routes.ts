/**
 * Bot Module Integration — all bot components co-located under src/modules/bot
 * for TypeScript rootDir compatibility. In production, extract to microservice.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { logger } from '@config/logger';
import Branding from '@modules/branding/models/branding.model';
import Tenant from '@modules/tenant/models/tenant.model';
import { keywordManager } from './engine/keywordManager';
import { taskEngine } from './engine/taskEngine';
import { gptAdapter } from './adapters/gpt.adapter';
import { governanceGuard } from './governance/governance.guard';
import BotAuditLog from './models/auditLog.model';

async function processMessage(input: {
    tenantId: string;
    userPhone: string;
    message: string;
    sessionId: string;
    botConfig: { name: string; tone: string; professionalName: string };
}): Promise<{ response: string; action: string }> {
    const startTime = Date.now();
    let response = '';
    let action = 'allowed';
    let taskExecuted: string | undefined;
    const keywordMatch = keywordManager.analyze(input.message);

    try {
        const preCheck = governanceGuard.preCheck(input.message, keywordMatch?.level);
        if (preCheck.action === 'escalated' || preCheck.action === 'modified') {
            response = preCheck.message;
            action = preCheck.action;
        } else if (keywordMatch?.level === 'administrative') {
            const taskResult = await taskEngine.execute(keywordMatch.action, input.tenantId, input.userPhone, input.message);
            response = taskResult.response;
            taskExecuted = taskResult.taskName;
            action = 'task_executed';
        } else {
            const systemPrompt = governanceGuard.buildSystemPrompt(input.botConfig.name, input.botConfig.tone, input.botConfig.professionalName);
            const llmResponse = await gptAdapter.generateResponse(systemPrompt, input.message);
            response = llmResponse.content;
            const postCheck = governanceGuard.postCheck(response);
            if (postCheck.action !== 'allowed') {
                response = postCheck.message;
                action = postCheck.action;
            }
        }
    } catch (error: any) {
        logger.error('Bot processing error:', error);
        response = 'Disculpá, tuve un problema procesando tu mensaje. Por favor intentá de nuevo.';
        action = 'error';
    }

    const latencyMs = Date.now() - startTime;

    try {
        await BotAuditLog.create({
            tenantId: input.tenantId,
            sessionId: input.sessionId,
            userPhone: input.userPhone,
            messageDirection: 'incoming',
            messageContent: input.message,
            taskExecuted,
            botResponse: response,
            keywordMatch: keywordMatch || undefined,
            governanceAction: action,
            latencyMs,
        });
    } catch (err) {
        logger.error('Bot audit log error:', err);
    }

    return { response, action };
}

const router = Router();

// WhatsApp Webhook Verification (GET)
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

// WhatsApp Webhook Messages (POST)
router.post('/webhook', async (req: Request, res: Response) => {
    try {
        res.sendStatus(200);
        const body = req.body;
        if (!body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) return;

        const entry = body.entry[0].changes[0].value;
        const message = entry.messages[0];
        if (message.type !== 'text') return;

        const userPhone = message.from;
        const messageText = message.text.body;
        const waBusinessId = entry.metadata?.phone_number_id;

        const tenant = await Tenant.findOne({}).lean() as any;
        if (!tenant) return;

        const tenantId = tenant.tenantId;
        const branding = await Branding.findOne({ tenantId }).lean() as any;

        const result = await processMessage({
            tenantId,
            userPhone,
            message: messageText,
            sessionId: `wa_${userPhone}_${Date.now()}`,
            botConfig: {
                name: branding?.nombreDelBot || 'Asistente Virtual',
                tone: branding?.tonoDelBot || 'neutro',
                professionalName: branding?.nombrePublico || 'el profesional',
            },
        });

        const apiUrl = process.env.WHATSAPP_API_URL;
        const apiToken = process.env.WHATSAPP_API_TOKEN;
        if (apiUrl && apiToken) {
            await fetch(`${apiUrl}/${waBusinessId}/messages`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ messaging_product: 'whatsapp', to: userPhone, type: 'text', text: { body: result.response } }),
            });
        } else {
            logger.info(`[Bot DEV] To: ${userPhone} | ${result.response}`);
        }
    } catch (error) {
        logger.error('WhatsApp webhook error:', error);
    }
});

export default router;
