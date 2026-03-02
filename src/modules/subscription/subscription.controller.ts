import { Request, Response, NextFunction } from 'express';
import { IAuthRequest } from '@shared/types';
import { subscriptionService } from './subscription.service';
import { sendSuccess } from '@shared/utils/apiResponse';
import { logger } from '@config/logger';
import { createHmac } from 'crypto';

export class SubscriptionController {
    async getSubscription(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const sub = await subscriptionService.getByTenant(req.tenantId!);
            sendSuccess(res, sub);
        } catch (error) { next(error); }
    }

    async upgrade(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const sub = await subscriptionService.upgradePlan(
                req.tenantId!, req.body.plan, req.body.externalSubscriptionId
            );
            sendSuccess(res, sub);
        } catch (error) { next(error); }
    }

    async cancel(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const sub = await subscriptionService.cancelSubscription(
                req.tenantId!, req.body.reason, req.body.immediate
            );
            sendSuccess(res, sub);
        } catch (error) { next(error); }
    }

    async getInvoices(req: IAuthRequest, res: Response, next: NextFunction) {
        try {
            const invoices = await subscriptionService.getInvoices(req.tenantId!);
            sendSuccess(res, invoices);
        } catch (error) { next(error); }
    }

    /**
     * Mercado Pago Webhook — no auth required, validated via signature
     */
    async mercadoPagoWebhook(req: Request, res: Response, next: NextFunction) {
        try {
            // Validate webhook signature if secret is configured
            const webhookSecret = process.env.MP_WEBHOOK_SECRET;
            if (webhookSecret) {
                const signature = req.headers['x-signature'] as string;
                const requestId = req.headers['x-request-id'] as string;
                if (signature && requestId) {
                    // Mercado Pago v2 signature validation
                    const ts = signature.split(',').find((p) => p.startsWith('ts='))?.split('=')[1];
                    const hash = signature.split(',').find((p) => p.startsWith('v1='))?.split('=')[1];
                    if (ts && hash) {
                        const manifest = `id:${req.body?.data?.id};request-id:${requestId};ts:${ts};`;
                        const expectedHash = createHmac('sha256', webhookSecret).update(manifest).digest('hex');
                        if (hash !== expectedHash) {
                            logger.warn('Mercado Pago webhook signature mismatch');
                            res.sendStatus(401);
                            return;
                        }
                    }
                }
            }

            const { type, data } = req.body;
            await subscriptionService.handleWebhook(type, data);
            res.sendStatus(200);
        } catch (error) {
            logger.error('Mercado Pago webhook error:', error);
            res.sendStatus(500); // Always return 200-500 to MP, don't expose errors
        }
    }
}

export const subscriptionController = new SubscriptionController();
